#pragma once

#include "bezier.h"
#include <glm/glm.hpp>
#include <glm/gtc/quaternion.hpp>

class CameraPath
{
public:
    void addKeyframe(const glm::vec3 &position, const glm::quat &rotation, float time)
    {
        m_posSpline.addKeyframe(position, time);
        m_rotSpline.addKeyframe(rotation, time);
    }

    void clear()
    {
        m_posSpline.clear();
        m_rotSpline.clear();
    }

    struct Pose
    {
        glm::vec3 position;
        glm::quat rotation;
    };

    Pose evaluate(float time)
    {
        Pose p;
        p.position = m_posSpline.evaluate(time);
        p.rotation = m_rotSpline.evaluate(time);
        return p;
    }

private:
    BezierSpline<glm::vec3> m_posSpline;
    BezierSpline<glm::quat> m_rotSpline;
};
