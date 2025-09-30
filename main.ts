function wifi_connect (ssid: string, password: string) {
    AT_command("AT+CWMODE=1", 1000, 0, true)
    AT_command("AT+CWJAP=\"" + ssid + "\",\"" + password + "\"", 10000, 1, true)
}
function wait_response (timeout: number) {
    response_OK = false
    i_list = read_list.length
    start = input.runningTime()
    while (input.runningTime() - start < timeout) {
        read_string = serial.readString()
        if (read_string.length > 0) {
            read_list.push(read_string)
            if (read_string.includes("" + String.fromCharCode(13) + String.fromCharCode(10) + "OK" + String.fromCharCode(13) + String.fromCharCode(10))) {
                _("bei CR LF O K CR LF vor timeout beenden")
                response_OK = true
                break;
            }
        }
        basic.pause(20)
    }
    return response_OK
}
function mqtt_publish_joystick () {
    if (pins.pins_i2cWriteBuffer(pins.pins_i2cAdressen(pins.ei2cAdressen.Joystick_x20), pins.buffer_fromArray([3]), true) == 0) {
        _("wenn 0 ist Joystick angeschlossen - I2C einlesen")
        bu = pins.pins_i2cReadBuffer(pins.pins_i2cAdressen(pins.ei2cAdressen.Joystick_x20), 3)
        joystick_x = pins.buffer_getUint8(bu, 0)
        joystick_y = pins.buffer_getUint8(bu, 2)
        _("Deadband: Werte um Ruhestellung 128 ausfiltern")
        if (joystick_x >= 122 && joystick_x <= 133) {
            joystick_x = 128
        }
        if (joystick_y >= 122 && joystick_y <= 133) {
            joystick_y = 128
        }
        if (joystick_fahren == joystick_x && joystick_lenken == joystick_y) {
            _("nichts geändert")
            return true
        } else {
            i_payload += 1
            _("in payload sind keine Kommas erlaubt")
            if (mqtt_publish("topic", "" + i_payload + ";j;" + joystick_x + ";" + joystick_y)) {
                joystick_fahren = joystick_x
                joystick_lenken = joystick_y
                return true
            } else {
                basic.pause(200)
                return false
            }
        }
    } else {
        return false
    }
}
input.onButtonEvent(Button.A, input.buttonEventClick(), function () {
    print_60()
})
function mqtt_publish (topic: string, payload: string) {
    return AT_command("AT+MQTTPUB=0,\"" + topic + "\",\"" + payload + "\",1,0", 5000, 0, true)
}
input.onButtonEvent(Button.AB, input.buttonEventClick(), function () {
    i_payload = 0
    while (true) {
        mqtt_publish_joystick()
        basic.pause(100)
    }
    basic.setLedColors(0x000000, 0x000000, 0xff00ff)
})
input.onButtonEvent(Button.B, input.buttonEventClick(), function () {
    lcd20x4.clearScreen(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.eLCD_CLEARDISPLAY.LCD_CLEARDISPLAY)
    wifi_connect("TXT4.0-sWp6", "ozvTwHC7")
    if (OK) {
        basic.setLedColors(0x000000, 0x00ff00, 0x000000)
    } else {
        basic.setLedColors(0x000000, 0xff0000, 0x000000)
    }
})
function AT_command (at: string, timeout: number, row: number, enabled: boolean) {
    if (enabled) {
        serial.writeString("" + at + String.fromCharCode(13) + String.fromCharCode(10))
        OK = wait_response(timeout)
        print_response(read_list, row)
        return OK
    } else {
        return false
    }
}
function _ (Kommentar: string) {
	
}
input.onButtonEvent(Button.A, input.buttonEventValue(ButtonEvent.Hold), function () {
    lcd20x4.clearScreen(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.eLCD_CLEARDISPLAY.LCD_CLEARDISPLAY)
    AT_command("AT+MQTTCONN?", 1000, 0, true)
})
input.onButtonEvent(Button.B, input.buttonEventValue(ButtonEvent.Hold), function () {
    lcd20x4.clearScreen(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.eLCD_CLEARDISPLAY.LCD_CLEARDISPLAY)
    mqtt_connect("192.168.8.2", "1884")
    if (OK) {
        basic.setLedColors(0x000000, 0x000000, 0x00ff00)
    } else {
        basic.setLedColors(0x000000, 0x000000, 0xff0000)
    }
})
function print_response (read_list: any[], row: number) {
    if (row == 0) {
        lcd20x4.clearScreen(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.eLCD_CLEARDISPLAY.LCD_CLEARDISPLAY)
    }
    lcd20x4.setCursor(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), row, 0)
    i = i_list
    while (read_list.length > i) {
        lcd20x4.writeLCD(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), read_list[i])
        lcd20x4.writeLCD(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.lcd20x4_text("$"))
        i += 1
    }
}
function print_60 () {
    _("zeigt 60 Zeichen aus read_list an und schaltet weiter")
    text = read_list[i_list]
    lcd20x4.clearScreen(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), lcd20x4.eLCD_CLEARDISPLAY.LCD_CLEARDISPLAY)
    lcd20x4.writeText(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), 0, 0, 19, "" + i_list + " " + i_substring + " " + text.length)
    lcd20x4.setCursor(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), 1, 0)
    lcd20x4.writeLCD(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), text.substr(i_substring, 60))
    if (text.length > i_substring + 60) {
        i_substring += 60
    } else if (read_list.length - 1 > i_list) {
        i_list += 1
        i_substring = 0
    } else {
        i_list = 0
        i_substring = 0
    }
}
function mqtt_connect (host: string, port: string) {
    AT_command("AT+MQTTUSERCFG=0,1,\"calliope\",\"\",\"\",0,0,\"\"", 5000, 0, true)
    AT_command("AT+MQTTCONN=0,\"" + host + "\"," + port + ",0", 5000, 1, true)
}
let text = ""
let i = 0
let i_payload = 0
let joystick_lenken = 0
let joystick_fahren = 0
let joystick_y = 0
let joystick_x = 0
let bu: Buffer = null
let read_string = ""
let start = 0
let response_OK = false
let OK = false
let i_substring = 0
let i_list = 0
let read_list: string[] = []
let GMR_GROVE_138 = "AT version:1.6.0.0(Feb  3 2018 12:00:06)^^SDK version:2.2.1(f42c330)^^compile time:Feb 12 2018 16:31:26^^Bin version(Wroom 02):1.6.1^^OK^^"
let GMR_SPARKFUN_109 = "AT version:1.7.5.0(Okt  9 2021 09:26:04)^^SDK version:3.0.5(b29dsd3)^^compile time:Sep 15 2022 20:04:36^^OK^^"
let GMR_CYTRON_187 = "AT version:2.2.0.0(b097cdf - ESP8266 - Jun 17 2021 12:57:45)^^SDK version:v3.4-22-g967752e2^^compile time(6800286):Aug  4 2021 17:34:06^^Bin version:2.2.0(Cytron_ESP-12F_WROOM-02)^^^^OK^^"
lcd20x4.initLCD(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4))
lcd20x4.writeText(lcd20x4.lcd20x4_eADDR(lcd20x4.eADDR.LCD_20x4), 0, 0, 19, lcd20x4.lcd20x4_text("MQTT_Fernbedienung"))
serial.redirect(
SerialPin.C17,
SerialPin.C16,
BaudRate.BaudRate115200
)
serial.setTxBufferSize(80)
serial.setRxBufferSize(200)
read_list = []
i_list = 0
i_substring = 0
AT_command("AT+RST", 1000, 0, true)
AT_command("AT+CMD?", 1000, 0, false)
AT_command("ATE1", 1000, 0, false)
AT_command("AT+GMR", 1000, 0, false)
if (OK) {
    basic.setLedColors(0x00ff00, 0x000000, 0x000000)
} else {
    basic.setLedColors(0xff0000, 0x000000, 0x000000)
}
