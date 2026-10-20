module.exports = {
    MQTT_TOPICS: {
        SENSOR_DATA:   'iot/sensors/data',      // ESP32 → Backend
        DEVICE_COMMAND:'iot/devices/command',   // Backend → ESP32
        DEVICE_STATUS: 'iot/devices/status'     // ESP32 → Backend
    },
    SENSOR_IDS: {
        TEMPERATURE: 1,
        HUMIDITY:    2,
        LIGHT:       3
    },
    DEVICE_IDS: {
        LED1: 1,
        LED2: 2,
        LED3: 3
    },
    ACTION_STATUS: {
        LOADING: 'LOADING',
        SUCCESS: 'SUCCESS',
        FAILED:  'FAILED'
    }
};