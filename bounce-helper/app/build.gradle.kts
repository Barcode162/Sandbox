plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// CI passes -PversionCode=<run number> so every new build installs over the old one.
val buildNumber = (project.findProperty("versionCode") as String?)?.toIntOrNull() ?: 1

android {
    namespace = "com.barcode162.bouncehelper"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.barcode162.bouncehelper"
        minSdk = 26          // Android 8.0+, needed for continuous held-finger gestures
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
            // No shrinking/obfuscation: keeps the APK plain and boring for installers.
            isMinifyEnabled = false
            isShrinkResources = false
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

dependencies {
    testImplementation("junit:junit:4.13.2")
}
