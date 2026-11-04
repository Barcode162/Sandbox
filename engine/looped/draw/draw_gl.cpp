// The drawing piece's WebGL2 backend (J116.4): see draw.h.
#include <GLES3/gl3.h>
#include <emscripten/emscripten.h>
#include <emscripten/html5.h>

#include <algorithm>
#include <cmath>
#include <cstring>
#include <string>
#include <vector>

#include "looped/draw/draw.h"
#include "looped/draw/half.h"

namespace engine::draw {

namespace {

GLuint compile(GLenum type, const std::string& src, std::string* problem) {
  const GLuint s = glCreateShader(type);
  const char* text = src.c_str();
  glShaderSource(s, 1, &text, nullptr);
  glCompileShader(s);
  GLint ok = 0;
  glGetShaderiv(s, GL_COMPILE_STATUS, &ok);
  if (!ok) {
    char log[2048] = {};
    glGetShaderInfoLog(s, sizeof log, nullptr, log);
    if (problem->empty()) *problem = std::string(type == GL_VERTEX_SHADER ? "vertex" : "fragment") + " shader: " + log;
    glDeleteShader(s);
    return 0;
  }
  return s;
}

class GlDevice final : public Device {
 public:
  explicit GlDevice(std::string canvas) : canvas_(std::move(canvas)) {}
  ~GlDevice() override {
    if (ctx_) emscripten_webgl_destroy_context(ctx_);
  }

  bool init() {
    EmscriptenWebGLContextAttributes a;
    emscripten_webgl_init_context_attributes(&a);
    a.majorVersion = 2;
    a.minorVersion = 0;
    a.alpha = false;
    a.depth = true;
    a.antialias = true;
    a.powerPreference = EM_WEBGL_POWER_PREFERENCE_HIGH_PERFORMANCE;
    ctx_ = emscripten_webgl_create_context(canvas_.c_str(), &a);
    if (ctx_ <= 0) return false;
    emscripten_webgl_make_context_current(ctx_);
    glGenBuffers(1, &ubo_);
    floatTargets_ = emscripten_webgl_enable_extension(ctx_, "EXT_color_buffer_float");
    return true;
  }

  Backend backend() const override { return Backend::kWebGl2; }

  void resize(uint32_t* w, uint32_t* h) override {
    double cw = 0, ch = 0;
    emscripten_get_element_css_size(canvas_.c_str(), &cw, &ch);
    const double dpr = std::min(static_cast<double>(maxPixelRatio), emscripten_get_device_pixel_ratio());
    const int pw = std::max(1, static_cast<int>(std::lround(cw * dpr))), ph = std::max(1, static_cast<int>(std::lround(ch * dpr)));
    int cur_w = 0, cur_h = 0;
    emscripten_get_canvas_element_size(canvas_.c_str(), &cur_w, &cur_h);
    if (cur_w != pw || cur_h != ph) emscripten_set_canvas_element_size(canvas_.c_str(), pw, ph);
    width_ = static_cast<uint32_t>(pw), height_ = static_cast<uint32_t>(ph);
    *w = width_, *h = height_;
  }

  Handle vertexBuffer(const void* data, size_t bytes) override {
    GLuint b;
    glGenBuffers(1, &b);
    glBindBuffer(GL_ARRAY_BUFFER, b);
    glBufferData(GL_ARRAY_BUFFER, static_cast<GLsizeiptr>(bytes), data, GL_STATIC_DRAW);
    return b;
  }

  Handle indexBuffer(const uint32_t* data, size_t count) override {
    GLuint b;
    glGenBuffers(1, &b);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, b);
    glBufferData(GL_ELEMENT_ARRAY_BUFFER, static_cast<GLsizeiptr>(count * 4), data, GL_STATIC_DRAW);
    return b;
  }

  Handle texture(int w, int h, Format f, const void* data, bool repeat) override {
    GLuint t;
    glGenTextures(1, &t);
    glBindTexture(GL_TEXTURE_2D, t);
    if (f == Format::kRgba16f) glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_HALF_FLOAT, data);
    else glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, data);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, repeat ? GL_REPEAT : GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, repeat ? GL_REPEAT : GL_CLAMP_TO_EDGE);
    return t;
  }

  void updateTexture(Handle t, int w, int h, Format f, const void* data) override {
    glBindTexture(GL_TEXTURE_2D, t);
    if (f == Format::kRgba16f) glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, w, h, GL_RGBA, GL_HALF_FLOAT, data);
    else glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, w, h, GL_RGBA, GL_UNSIGNED_BYTE, data);
  }

  void updateVertices(Handle b, size_t offset, const void* data, size_t bytes) override {
    glBindBuffer(GL_ARRAY_BUFFER, b);
    glBufferSubData(GL_ARRAY_BUFFER, static_cast<GLintptr>(offset), static_cast<GLsizeiptr>(bytes), data);
  }

  void updateIndices(Handle b, const uint32_t* data, size_t count) override {
    glBindVertexArray(0);
    glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, b);
    glBufferSubData(GL_ELEMENT_ARRAY_BUFFER, 0, static_cast<GLsizeiptr>(count * 4), data);
    for (Pipe& p : pipes_) p.boundVertices = 0;  // rebind next draw
  }

  Handle pipeline(const PipelineDesc& d) override {
    const size_t cut = d.glsl.find("//--- fragment");
    if (cut == std::string::npos) {
      if (problem.empty()) problem = d.label + ": the GLSL needs a //--- fragment line";
      return 0;
    }
    const GLuint vs = compile(GL_VERTEX_SHADER, d.glsl.substr(0, cut), &problem);
    const size_t fragStart = d.glsl.find('\n', cut);  // the line after the marker (#version must come first)
    const GLuint fs = compile(GL_FRAGMENT_SHADER, fragStart == std::string::npos ? std::string() : d.glsl.substr(fragStart + 1), &problem);
    if (!vs || !fs) return 0;
    const GLuint prog = glCreateProgram();
    glAttachShader(prog, vs);
    glAttachShader(prog, fs);
    glLinkProgram(prog);
    GLint ok = 0;
    glGetProgramiv(prog, GL_LINK_STATUS, &ok);
    glDeleteShader(vs);
    glDeleteShader(fs);
    if (!ok) {
      char log[2048] = {};
      glGetProgramInfoLog(prog, sizeof log, nullptr, log);
      if (problem.empty()) problem = d.label + ": " + log;
      return 0;
    }
    Pipe p;
    p.program = prog;
    p.desc = d;
    const GLuint block = glGetUniformBlockIndex(prog, "U");
    if (block != GL_INVALID_INDEX) glUniformBlockBinding(prog, block, 0);
    glUseProgram(prog);
    for (int k = 0; k < d.textures; ++k) {
      const std::string name = "tex" + std::to_string(k);
      const GLint loc = glGetUniformLocation(prog, name.c_str());
      if (loc >= 0) glUniform1i(loc, k);
    }
    glGenVertexArrays(1, &p.vao);
    pipes_.push_back(p);
    return static_cast<Handle>(pipes_.size());
  }

  Handle target(int w, int h) override {
    GLuint t;
    glGenTextures(1, &t);
    glBindTexture(GL_TEXTURE_2D, t);
    // RGBA16F where the browser can draw into it (about all of them); RGBA8 otherwise.
    if (floatTargets_) glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA16F, w, h, 0, GL_RGBA, GL_HALF_FLOAT, nullptr);
    else glTexImage2D(GL_TEXTURE_2D, 0, GL_RGBA8, w, h, 0, GL_RGBA, GL_UNSIGNED_BYTE, nullptr);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_NEAREST);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
    glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
    Target tg;
    tg.w = w, tg.h = h;
    glGenFramebuffers(1, &tg.fbo);
    glBindFramebuffer(GL_FRAMEBUFFER, tg.fbo);
    glFramebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, t, 0);
    GLuint rb;
    glGenRenderbuffers(1, &rb);
    glBindRenderbuffer(GL_RENDERBUFFER, rb);
    glRenderbufferStorage(GL_RENDERBUFFER, GL_DEPTH_COMPONENT24, w, h);
    glFramebufferRenderbuffer(GL_FRAMEBUFFER, GL_DEPTH_ATTACHMENT, GL_RENDERBUFFER, rb);
    if (glCheckFramebufferStatus(GL_FRAMEBUFFER) != GL_FRAMEBUFFER_COMPLETE && problem.empty()) problem = "a drawing target isn't complete";
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    targets_.push_back({t, tg});
    return t;
  }

  bool beginTarget(Handle t, const float clear[4]) override {
    emscripten_webgl_make_context_current(ctx_);
    for (const auto& [tex, tg] : targets_) {
      if (tex != t) continue;
      glBindFramebuffer(GL_FRAMEBUFFER, tg.fbo);
      glViewport(0, 0, tg.w, tg.h);
      glClearColor(clear[0], clear[1], clear[2], clear[3]);
      glClearDepthf(1);
      glDepthMask(GL_TRUE);
      glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
      return true;
    }
    return false;
  }

  void endTarget() override { glBindFramebuffer(GL_FRAMEBUFFER, 0); }

  bool begin(const float clear[4]) override {
    emscripten_webgl_make_context_current(ctx_);
    glBindFramebuffer(GL_FRAMEBUFFER, 0);
    glViewport(0, 0, static_cast<GLsizei>(width_), static_cast<GLsizei>(height_));
    glClearColor(clear[0], clear[1], clear[2], clear[3]);
    glClearDepthf(1);
    glDepthMask(GL_TRUE);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    return true;
  }

  void drawIndexed(Handle pipeline, Handle vertices, Handle indices, uint32_t count, const void* uniforms, size_t bytes,
                   const Handle* textures, int textureCount) override {
    if (!pipeline || pipeline > pipes_.size()) return;
    Pipe& p = pipes_[pipeline - 1];
    glUseProgram(p.program);
    glBindVertexArray(p.vao);
    if (p.boundVertices != vertices || p.boundIndices != indices) {
      glBindBuffer(GL_ARRAY_BUFFER, vertices);
      for (size_t i = 0; i < p.desc.layout.items.size(); ++i) {
        const auto& it = p.desc.layout.items[i];
        const auto loc = static_cast<GLuint>(i);
        const auto off = reinterpret_cast<const void*>(static_cast<uintptr_t>(it.offset));
        const auto stride = static_cast<GLsizei>(p.desc.layout.stride);
        glEnableVertexAttribArray(loc);
        switch (it.type) {
          case Attr::kFloat2: glVertexAttribPointer(loc, 2, GL_FLOAT, GL_FALSE, stride, off); break;
          case Attr::kFloat3: glVertexAttribPointer(loc, 3, GL_FLOAT, GL_FALSE, stride, off); break;
          case Attr::kFloat4: glVertexAttribPointer(loc, 4, GL_FLOAT, GL_FALSE, stride, off); break;
          case Attr::kUnorm8x4: glVertexAttribPointer(loc, 4, GL_UNSIGNED_BYTE, GL_TRUE, stride, off); break;
          case Attr::kUint8x4: glVertexAttribIPointer(loc, 4, GL_UNSIGNED_BYTE, stride, off); break;
          case Attr::kHalf4: glVertexAttribPointer(loc, 4, GL_HALF_FLOAT, GL_FALSE, stride, off); break;
          case Attr::kUnorm16x2: glVertexAttribPointer(loc, 2, GL_UNSIGNED_SHORT, GL_TRUE, stride, off); break;
          case Attr::kSnorm8x4: glVertexAttribPointer(loc, 4, GL_BYTE, GL_TRUE, stride, off); break;
        }
      }
      glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, indices);
      p.boundVertices = vertices, p.boundIndices = indices;
    }
    glBindBuffer(GL_UNIFORM_BUFFER, ubo_);
    glBufferData(GL_UNIFORM_BUFFER, static_cast<GLsizeiptr>(bytes), uniforms, GL_DYNAMIC_DRAW);
    glBindBufferBase(GL_UNIFORM_BUFFER, 0, ubo_);
    for (int k = 0; k < textureCount; ++k) {
      glActiveTexture(GL_TEXTURE0 + static_cast<GLenum>(k));
      glBindTexture(GL_TEXTURE_2D, textures[k]);
    }
    if (p.desc.depth) glEnable(GL_DEPTH_TEST), glDepthFunc(GL_LESS);
    else glDisable(GL_DEPTH_TEST);
    if (p.desc.cullBack) glEnable(GL_CULL_FACE), glCullFace(GL_BACK), glFrontFace(GL_CCW);
    else glDisable(GL_CULL_FACE);
    glDrawElements(GL_TRIANGLES, static_cast<GLsizei>(count), GL_UNSIGNED_INT, nullptr);
  }

  void end() override {}  // the browser shows the canvas when the frame returns

 private:
  struct Pipe {
    GLuint program = 0, vao = 0;
    Handle boundVertices = 0, boundIndices = 0;
    PipelineDesc desc;
  };
  std::string canvas_;
  EMSCRIPTEN_WEBGL_CONTEXT_HANDLE ctx_ = 0;
  GLuint ubo_ = 0;
  uint32_t width_ = 1, height_ = 1;
  std::vector<Pipe> pipes_;
  struct Target {
    GLuint fbo = 0;
    int w = 0, h = 0;
  };
  std::vector<std::pair<Handle, Target>> targets_;
  bool floatTargets_ = false;
};

}  // namespace

std::unique_ptr<Device> createGl(const char* canvas) {
  auto d = std::make_unique<GlDevice>(canvas);
  if (!d->init()) return nullptr;
  return d;
}

}  // namespace engine::draw
