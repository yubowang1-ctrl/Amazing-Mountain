#ifndef SETTINGS_H
#define SETTINGS_H

#include <string>

struct Settings {
    std::string sceneFilePath;
    int shapeParameter1 = 1;
    int shapeParameter2 = 1;
    int shapeParameter3 = 1;
    int shapeParameter4 = 1; // forest coverage
    int shapeParameter5 = 1; // trees per cluster
    int shapeParameter6 = 1; // leaf density
    float nearPlane = 1;
    float farPlane = 1;

    float fogDensity    = 0.06f;  // 0.01–0.30
    float fogHeight     = 0.0f;   // world-space y
    float waveSpeed     = 0.05f;  // 0.00–0.20
    float waveStrength  = 0.02f;  // 0.00–0.10

    bool perPixelFilter = false;
    bool kernelBasedFilter = false;
    bool extraCredit1 = false;
    bool extraCredit2 = false;
    bool extraCredit3 = false;
    bool extraCredit4 = false;
};


// The global Settings object, will be initialized by MainWindow
extern Settings settings;

#endif // SETTINGS_H
