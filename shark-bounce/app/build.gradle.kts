plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// CI passes -PversionCode=<run number> so every new build installs over the old one.
val buildNumber = (project.findProperty("versionCode") as String?)?.toIntOrNull() ?: 1

android {
    namespace = "com.barcode162.sharkbounce"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.barcode162.sharkbounce"
        minSdk = 21
        targetSdk = 35
        versionCode = buildNumber
        versionName = "1.0.$buildNumber"
    }

    signingConfigs {
        // A shared, intentionally public key so anyone can build an installable APK
        // and updates always install over the previous version. Not a secret.
        create("shared") {
            storeFile = file("../signing/sharkbounce.keystore")
            storePassword = "android"
            keyAlias = "sharkbounce"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"))
            signingConfig = signingConfigs.getByName("shared")
        }
        debug {
            signingConfig = signingConfigs.getByName("shared")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}
