cmake_minimum_required(VERSION 3.20)
project(Hearthwake LANGUAGES CXX)

if(NOT EMSCRIPTEN)
  message(FATAL_ERROR "Build with Emscripten: emcmake cmake -B build -G Ninja (or: bash house/build.sh)")
endif()

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
if(NOT CMAKE_BUILD_TYPE)
  set(CMAKE_BUILD_TYPE Release)
endif()

# Looped, the engine (engine/looped): its own library. It never includes the
# game's files (engine/tools/lint_engine.mjs). An object library, so every
# engine file is linked whole.
file(GLOB_RECURSE ENGINE_SOURCES CONFIGURE_DEPENDS engine/looped/*.cpp)
list(FILTER ENGINE_SOURCES EXCLUDE REGEX "/looped/apps/")
add_library(looped OBJECT ${ENGINE_SOURCES})
target_include_directories(looped PUBLIC ${CMAKE_SOURCE_DIR}/engine)
target_compile_options(looped PRIVATE -Wall -Wextra -Werror)
target_compile_options(looped PUBLIC --use-port=emdawnwebgpu)

# The house: Hearthwake's own code on top of the engine.
file(GLOB_RECURSE HOUSE_SOURCES CONFIGURE_DEPENDS house/app/*.cpp)
add_executable(house ${HOUSE_SOURCES})
target_link_libraries(house PRIVATE looped)
target_compile_options(house PRIVATE -Wall -Wextra -Werror)
target_link_options(house PRIVATE
  --use-port=emdawnwebgpu
  "--embed-file=${CMAKE_SOURCE_DIR}/engine/looped/shaders@/shaders"
  "--embed-file=${CMAKE_SOURCE_DIR}/house/assets/world@/assets/world"
  -sALLOW_MEMORY_GROWTH=1
  -sINITIAL_MEMORY=64MB
  -sSTACK_SIZE=1MB
  -sENVIRONMENT=web
  -sEXPORTED_RUNTIME_METHODS=[]
  # Used from EM_ASM blocks (looped/audio.cpp, looped/net.cpp).
  "-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$stringToUTF8,$UTF8ToString,$stringToNewUTF8"
  # Used by the image decoder (looped/fetch.cpp).
  "-sEXPORTED_FUNCTIONS=_main,_malloc,_free"
)
if(CMAKE_BUILD_TYPE STREQUAL "Release")
  target_link_options(house PRIVATE -O3 --closure=1)
else()
  target_link_options(house PRIVATE -g -sASSERTIONS=2)
endif()

# Re-link when the shaders or the world's files change (they are embedded).
file(GLOB SHADER_FILES CONFIGURE_DEPENDS engine/looped/shaders/*.wgsl)
file(GLOB_RECURSE WORLD_FILES CONFIGURE_DEPENDS house/assets/world/*.json)
set_property(TARGET house APPEND PROPERTY LINK_DEPENDS ${SHADER_FILES} ${WORLD_FILES})
