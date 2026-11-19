"""Resources for electronics, Raspberry Pi, optics, telemetry, navigation and systems. Checked on 19 Nov 2026."""
R = [
 # electronics
 ("wokwi", "https://wokwi.com/", "Wokwi simulator", "Wokwi", "freemium", "2–10 h", "beginner", "en"),
 ("sparkfun-ohm", "https://learn.sparkfun.com/tutorials/voltage-current-resistance-and-ohms-law", "Voltage, current, resistance and Ohm's law", "SparkFun", "free", "1 h", "beginner", "en"),
 ("sparkfun-serial", "https://learn.sparkfun.com/tutorials/serial-communication", "Serial communication (UART)", "SparkFun", "free", "1 h", "beginner", "en"),
 ("sparkfun-i2c", "https://learn.sparkfun.com/tutorials/i2c", "I2C", "SparkFun", "free", "1 h", "beginner", "en"),
 ("sparkfun-spi", "https://learn.sparkfun.com/tutorials/serial-peripheral-interface-spi", "SPI", "SparkFun", "free", "1 h", "beginner", "en"),
 ("allaboutcircuits", "https://www.allaboutcircuits.com/textbook/", "All About Circuits textbook", "EETech", "free", "reference", "beginner", "en"),
 # raspberry pi
 ("rpi-camera-sw", "https://www.raspberrypi.com/documentation/computers/camera_software.html", "Camera software", "Raspberry Pi", "free", "3–5 h", "beginner", "en"),
 ("rpi-camera-hw", "https://www.raspberrypi.com/documentation/accessories/camera.html", "Camera hardware and specifications", "Raspberry Pi", "free", "1 h", "beginner", "en"),
 ("picamera2-manual", "https://datasheets.raspberrypi.com/camera/picamera2-manual.pdf", "The Picamera2 Library", "Raspberry Pi", "free", "4–8 h", "beginner", "en"),
 ("rpi-picamera-project", "https://projects.raspberrypi.org/en/projects/getting-started-with-picamera", "Getting started with the Camera Module", "Raspberry Pi Foundation", "free", "1 h", "beginner", "en"),
 # optics
 ("edmund-guide", "https://www.edmundoptics.com/knowledge-center/industry-expertise/imaging-optics/imaging-resource-guide/", "Imaging Resource Guide", "Edmund Optics", "free", "3–5 h", "intermediate", "en"),
 ("edmund-fov", "https://www.edmundoptics.com/knowledge-center/application-notes/imaging/understanding-focal-length-and-field-of-view/", "Understanding focal length and field of view", "Edmund Optics", "free", "30 min", "beginner", "en"),
 ("edmund-calc", "https://www.edmundoptics.com/knowledge-center/tech-tools/imaging-system-parameter-calculator/", "Imaging System Parameter Calculator", "Edmund Optics", "free", "tool", "beginner", "en"),
 ("gsd-calc", "https://www.omnicalculator.com/other/ground-sample-distance", "Ground sample distance calculator", "Omni Calculator", "free", "tool", "beginner", "en"),
 ("basler-shutter", "https://www.baslerweb.com/en/learning/cmos-rolling-shutter-cameras/", "CMOS rolling shutter cameras", "Basler", "free", "30 min", "beginner", "en"),
 ("axis-thermal", "https://whitepapers.axis.com/download/wp_thermal_cameras_t10170984_2501.pdf", "Thermal cameras (white paper)", "Axis", "free", "1 h", "beginner", "en"),
 ("opencv-calib", "https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html", "Camera calibration tutorial", "OpenCV", "free", "2 h", "intermediate", "en"),
 # telemetry and links
 ("ardupilot-sitl", "https://ardupilot.org/dev/docs/sitl-simulator-software-in-the-loop.html", "ArduPilot SITL simulator", "ArduPilot", "free", "3–4 h", "beginner", "en"),
 ("ardupilot-gazebo", "https://ardupilot.org/dev/docs/sitl-with-gazebo.html", "ArduPilot SITL with Gazebo", "ArduPilot", "free", "3–4 h", "intermediate", "en"),
 ("px4-sim", "https://docs.px4.io/main/en/simulation/", "PX4 simulation", "PX4", "free", "2–4 h", "intermediate", "en"),
 ("mavlink", "https://mavlink.io/en/", "MAVLink developer guide", "MAVLink", "free", "2–3 h", "intermediate", "en"),
 ("pymavlink", "https://mavlink.io/en/mavgen_python/", "Using pymavlink", "MAVLink", "free", "1 h", "intermediate", "en"),
 ("mavsdk", "https://mavsdk.mavlink.io/main/en/", "MAVSDK", "MAVLink", "free", "2 h", "intermediate", "en"),
 ("ardupilot-companion", "https://ardupilot.org/dev/docs/companion-computers.html", "Companion computers", "ArduPilot", "free", "1 h", "intermediate", "en"),
 ("qgc", "https://docs.qgroundcontrol.com/master/en/qgc-user-guide/", "QGroundControl user guide", "Dronecode", "free", "1–2 h", "beginner", "en"),
 ("elrs-signal", "https://www.expresslrs.org/info/signal-health/", "ExpressLRS: signal health", "ExpressLRS", "free", "1 h", "beginner", "en"),
 ("crsf-spec", "https://github.com/tbs-fpv/tbs-crsf-spec", "CRSF protocol specification", "Team BlackSheep", "free", "1 h", "intermediate", "en"),
 ("pysdr", "https://pysdr.org/", "PySDR: a guide to SDR and DSP using Python", "Marc Lichtman", "free", "3–10 h", "intermediate", "en"),
 # estimation and navigation
 ("kalman-book", "https://github.com/rlabbe/Kalman-and-Bayesian-Filters-in-Python", "Kalman and Bayesian Filters in Python", "Roger Labbe", "free", "20–40 h", "beginner", "en"),
 ("kalmanfilter-net", "https://www.kalmanfilter.net/", "kalmanfilter.net tutorial", "Alex Becker", "free", "3–5 h", "beginner", "en"),
 ("vectornav-primer", "https://www.vectornav.com/resources/inertial-navigation-primer", "Inertial Navigation Primer", "VectorNav", "free", "4–6 h", "intermediate", "en"),
 ("novatel-gnss", "https://novatel.com/an-introduction-to-gnss", "An Introduction to GNSS", "NovAtel", "free", "3–4 h", "beginner", "en"),
 ("rep-103", "https://www.ros.org/reps/rep-0103.html", "REP 103: units and coordinate conventions", "ROS", "free", "30 min", "beginner", "en"),
 ("mavsim", "https://github.com/byu-magicc/mavsim_public", "Small Unmanned Aircraft: book draft and simulator", "Beard and McLain, BYU", "free", "30+ h", "intermediate", "en"),
 # the whole system
 ("nasa-se", "https://www.nasa.gov/reference/systems-engineering-handbook/", "NASA Systems Engineering Handbook", "NASA", "free", "3 h for chapter 2", "beginner", "en"),
 ("mit-16842", "https://ocw.mit.edu/courses/16-842-fundamentals-of-systems-engineering-fall-2015/", "16.842 Fundamentals of Systems Engineering", "MIT OpenCourseWare", "free", "10–30 h", "advanced", "en"),
 ("gstreamer-tools", "https://gstreamer.freedesktop.org/documentation/tutorials/basic/gstreamer-tools.html", "GStreamer tools", "GStreamer", "free", "2 h", "beginner", "en"),
 ("ros2-first", "https://docs.ros.org/en/lyrical/First-Steps.html", "ROS 2: first steps", "Open Robotics", "free", "4–6 h", "beginner", "en"),
]
