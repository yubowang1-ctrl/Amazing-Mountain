#ifndef SETTINGS_H
#define SETTINGS_H

#include <string>

struct Settings
{
    std::string sceneFilePath;
    int shapeParameter1 = 1;
    int shapeParameter2 = 1;
    int shapeParameter3 = 1;
    int shapeParameter4 = 1; // forest coverage
    int shapeParameter5 = 1; // trees per cluster
    int shapeParameter6 = 1; // leaf density
    int shapeParameter7 = 1; // rock density
    float nearPlane = 1;
    float farPlane = 1;
    bool perPixelFilter = false;
    bool kernelBasedFilter = false;
    bool extraCredit1 = false;
    bool extraCredit2 = false;
    bool extraCredit3 = false;
    bool extraCredit4 = false;

    // Water rendering parameters
    float waveSpeed = 0.1f;           // Range: 0.0 to 1.0
    float waveStrength = 0.02f;       // Range: 0.0 to 0.1
    float waterClarity = 0.1f;       // Range: 0.0 to 1.0
    float fresnelPower = 2.0f;       // Range: 0.1 to 10.0

    // Post‑processing / color grading
    // 0 = off, 1 = cold blue, 3 = rainy / overcast
    int colorGradePreset = 0;
};

// The global Settings object, will be initialized by MainWindow
extern Settings settings;

#endif // SETTINGS_H
