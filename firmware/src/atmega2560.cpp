#include <Arduino.h>
#include "AccelStepper.h"

void all_axis_homing();
void s1_s2_catcher_open();
void s1_s2_catcher_close();
void puri_push_drill_down();
void puri_pull_drill_up();
void puri_push_s_catcher_open1();

void puri_push_s_catcher_open1_plate_cup_up(); // for first puri
void blower_plate_cup_down();
void cup_dispense();
void puri_pull_s_catcher_close1_plate_cup_fwd_till_masala();
void blower_on_off_drill_down();
void puri_pull_drill_up_s_catcher_close1();

void puri_push_s_catcher_open1_masala_s_catcher_open2();
void puri_pull_drill_up_s_catcher_close1_s_catcher_close2();
void drill_down_up_masala_s_catcher_open2_close2_pani();

void puri_1_parallel();
void puri_2_parallel();
void puri_3_to_5_parallel();
void puri_6_parallel();

void conveyor();
void masala();
void s_catcher_open2();
void s_catcher_close2();
void plate_vaccum_on();
void plate_vaccum_off();
void puri_barrel_rotor();
void plate_rotate();
void water_refill();
void plate_cup_fwd_till_customer();

const int puri_catcher_step = 47; // catcher PUL+
const int puri_catcher_dir = 46;  // catcher DIR+

const int barrel_step = 49; // barrel PUL+
const int barrel_dir = 48;  // barrel DIR+

const int conveyor_home_sensor = 56;
const int conveyor_step = 41;
const int conveyor_dir = 40;

const int puri_catcher_home_sensor = 54;
const int ir = 55; // ir to detect presence of puri in the puri catcher

const int s_catcher_opener1_step = 45; // step of 1st silicon catcher i.e below puri catcher
const int s_catcher_opener1_dir = 44;
const int s_catcher_opener1_home_sensor = 57; // 1st silicon catcher's home sensor

const int s_catcher_opener2_step = 39;
const int s_catcher_opener2_dir = 38;
const int s_catcher_opener2_home_sensor = 59;

const int blower_pwm = 8;
const int blower_taco = 9;
const int blower_solenoid = 22;

const int drill_step = 43;
const int drill_dir = 42;
const int drill_home_sensor = 58;
const int drill_motor = 12;

const int alu = 11;
const int onion = 10;
const int channa = 7;
const int sev = 6;

const int plate_cup_vertical_home_sensor = 60; // LIZ
const int plate_cup_vertical_step = 37;        // NBR step
const int plate_cup_vertical_dir = 36;         // NBR dir

const int plate_cup_horizontal_home_sensor = 61; // LID
const int plate_cup_horizontal_step = 35;        // NPZ step
const int plate_cup_horizontal_dir = 34;         // NPZ dir

const int plate_vaccum = 5;        // FIG
const int plate_detect_ir = 62;    // LIY
const int cup_dispensor_motor = 4; // FIC
const int cup_detect_ir = 65;     // LEX

const int plate_rotor_step = 33; // NEX
const int plate_rotor_dir = 32;

const int water_refill_pump = 3;         // FIA
const int water_tank_float_sensor = 68; // FLA

const int spicy_sol = 2;     // FLA
const int spicy_mixer = 16;  // FPC
const int spicy_flavor = 17; // FPW

const int sweet_sol = 18;    // FCD
const int sweet_mixer = 19;  // FX1
const int sweet_flavor = 23; // TDL

const int all_motors_en = 69;

AccelStepper puriCatcher(AccelStepper::DRIVER, puri_catcher_step, puri_catcher_dir);
AccelStepper puriBarrel(AccelStepper::DRIVER, barrel_step, barrel_dir);
AccelStepper catcherOpener1(AccelStepper::DRIVER, s_catcher_opener1_step, s_catcher_opener1_dir);
AccelStepper catcherOpener2(AccelStepper::DRIVER, s_catcher_opener2_step, s_catcher_opener2_dir);
AccelStepper puriConveyor(AccelStepper::DRIVER, conveyor_step, conveyor_dir);
AccelStepper puriDrill(AccelStepper::DRIVER, drill_step, drill_dir);
AccelStepper pcVertical(AccelStepper::DRIVER, plate_cup_vertical_step, plate_cup_vertical_dir);
AccelStepper pcHorizontal(AccelStepper::DRIVER, plate_cup_horizontal_step, plate_cup_horizontal_dir);
AccelStepper plateRotor(AccelStepper::DRIVER, plate_rotor_step, plate_rotor_dir);

// ATmega2560 Kiosk Controller
// Receives commands from ESP8266 via Serial3 and controls kiosk hardware

String receivedData = "";
bool commandReceived = false;

void processCommand(String command);
void dispense();

void setup()
{
  Serial.begin(115200);  // USB serial for monitoring
  Serial3.begin(115200); // Communication with ESP8266

  pinMode(puri_catcher_home_sensor, INPUT_PULLUP); // Set sensor pin as input with pull-up resistor
  pinMode(ir, INPUT_PULLUP);
  pinMode(s_catcher_opener1_home_sensor, INPUT);

  pinMode(blower_pwm, OUTPUT);
  pinMode(blower_taco, INPUT_PULLUP);
  pinMode(blower_solenoid, OUTPUT);

  pinMode(conveyor_home_sensor, INPUT_PULLUP);

  pinMode(drill_home_sensor, INPUT);
  pinMode(drill_motor, OUTPUT);

  pinMode(alu, OUTPUT);
  pinMode(onion, OUTPUT);
  pinMode(channa, OUTPUT);
  pinMode(sev, OUTPUT);

  pinMode(plate_cup_vertical_home_sensor, INPUT);
  pinMode(plate_cup_horizontal_home_sensor, INPUT);

  pinMode(plate_detect_ir, INPUT);
  pinMode(cup_detect_ir, INPUT);
  pinMode(plate_vaccum, OUTPUT);
  pinMode(cup_dispensor_motor, OUTPUT);

  pinMode(water_tank_float_sensor, INPUT);
  pinMode(water_refill_pump, OUTPUT);

  pinMode(spicy_sol, OUTPUT);
  pinMode(spicy_flavor, OUTPUT);
  pinMode(spicy_mixer, OUTPUT);

  pinMode(sweet_sol, OUTPUT);
  pinMode(sweet_flavor, OUTPUT);
  pinMode(sweet_mixer, OUTPUT);

  puriCatcher.setMaxSpeed(5000);     // Set max speed  puri catcher
  puriCatcher.setAcceleration(4000); // Set acceleration

  puriBarrel.setMaxSpeed(2000); // barrel
  puriBarrel.setAcceleration(5000);

  catcherOpener1.setMaxSpeed(5000); // s_catcher_opener
  catcherOpener1.setAcceleration(3000);

  catcherOpener2.setMaxSpeed(5000); // s_catcher_opener
  catcherOpener2.setAcceleration(3000);

  puriConveyor.setMaxSpeed(5000);
  puriConveyor.setAcceleration(500);

  puriDrill.setMaxSpeed(5000);
  puriDrill.setAcceleration(3000);

  pcVertical.setMaxSpeed(9000);
  pcVertical.setAcceleration(5000);

  pcHorizontal.setMaxSpeed(9000);
  pcHorizontal.setAcceleration(5000);

  plateRotor.setMaxSpeed(5000);
  plateRotor.setAcceleration(3000);

  pinMode(all_motors_en, OUTPUT);
  digitalWrite(all_motors_en, HIGH);

  Serial.println("ATmega2560 Kiosk Controller Started");
  Serial.println("Waiting for commands from ESP8266...");
}

void loop()
{
  // Check for incoming data from ESP8266
  while (Serial3.available())
  {
    char inChar = (char)Serial3.read();

    if (inChar == '\n' || inChar == '\r')
    {
      if (receivedData.length() > 0)
      {
        processCommand(receivedData);
        receivedData = "";
      }
    }
    else
    {
      receivedData += inChar;
    }
  }
}

void processCommand(String command)
{
  command.trim();
  
  // Filter out non-command noise
  if (!command.startsWith("CMD:")) {
    // Optionally log noise to USB serial for debugging
    Serial.println("Ignored noise: " + command);
    return;
  }

  Serial.println("Valid Command: " + command);

  if (command == "CMD:DISPENSE PANIPURI")
  {
    Serial3.println("EVENT:READY");
    //dispense();
    delay(3000);
    Serial3.println("EVENT:COMPLETE");
  }
  else
  {
    Serial.println("Unknown command: " + command);
    Serial3.println("ERROR:UNKNOWN_COMMAND");
  }
}

void dispense()
{
  digitalWrite(all_motors_en, LOW);
  delay(100);
  all_axis_homing();
  Serial3.println("EVENT:READY");
  delay(100);
  puri_1_parallel(); // puri 1 @ station 1
  delay(100);
  conveyor(); // puri 1 @ station 2
  delay(100);
  puri_2_parallel(); // puri 2 @ station 1
  delay(100);
  conveyor(); // puri 1 @ station 3 puri 2 @ station 2
  delay(100);
  puri_3_to_5_parallel(); // puri 3 @ station 1 puri 1 --> out
  delay(100);
  conveyor(); // puri 2 @ station 3 puri 3 @ station 2
  delay(100);
  puri_3_to_5_parallel(); // puri 4 @ station 1 puri 2 --> out
  delay(100);
  conveyor(); // puri 4 @ sation 2 puri 3 @ station 3
  delay(100);
  puri_3_to_5_parallel(); // puri 5 @ station 1 puri 3 --> out
  delay(100);
  conveyor(); // puri 5 @ station 2 puri 4 @ station 3
  delay(100);
  puri_6_parallel();
  delay(1000);
  plate_cup_fwd_till_customer();
  delay(500);
  digitalWrite(all_motors_en, HIGH);
  delay(3000);
}

/* support functions */

void all_axis_homing()
{

  while (digitalRead(puri_catcher_home_sensor) == LOW || digitalRead(s_catcher_opener1_home_sensor) == LOW || digitalRead(s_catcher_opener2_home_sensor) == LOW || digitalRead(drill_home_sensor) == LOW || digitalRead(plate_cup_horizontal_home_sensor) == LOW || digitalRead(plate_cup_vertical_home_sensor) == LOW)
  {

    if (digitalRead(puri_catcher_home_sensor) == LOW)
    {

      puriCatcher.setSpeed(-4000);
      puriCatcher.runSpeed();
    }

    if (digitalRead(s_catcher_opener1_home_sensor) == LOW)
    {
      catcherOpener1.setSpeed(-4000);
      catcherOpener1.runSpeed();
    }

    if (digitalRead(s_catcher_opener2_home_sensor) == LOW)
    {
      catcherOpener2.setSpeed(4000);
      catcherOpener2.runSpeed();
    }

    if (digitalRead(drill_home_sensor) == LOW)
    {
      puriDrill.setSpeed(-4000);
      puriDrill.runSpeed();
    }

    if (digitalRead(plate_cup_horizontal_home_sensor) == LOW)
    {
      pcHorizontal.setSpeed(3000);
      pcHorizontal.runSpeed();
    }

    if (digitalRead(plate_cup_vertical_home_sensor) == LOW)
    {
      pcVertical.setSpeed(-5000);
      pcVertical.runSpeed();
    }
  }

  while (digitalRead(conveyor_home_sensor) == LOW)
  {
    if (digitalRead(conveyor_home_sensor) == LOW)
    {
      puriConveyor.setSpeed(4000);
      puriConveyor.runSpeed();
    }
  }

  water_refill();

  puriCatcher.setCurrentPosition(0);
  catcherOpener1.setCurrentPosition(0);
  catcherOpener2.setCurrentPosition(0);
  puriDrill.setCurrentPosition(0);
  pcHorizontal.setCurrentPosition(0);
  pcVertical.setCurrentPosition(0);
  puriConveyor.setCurrentPosition(0);
}

void s1_s2_catcher_open()
{

  if (digitalRead(s_catcher_opener1_home_sensor) == HIGH && digitalRead(s_catcher_opener2_home_sensor) == HIGH)
  {
    catcherOpener1.moveTo(5000);
    catcherOpener2.moveTo(-5000);

    while (catcherOpener1.distanceToGo() != 0 && catcherOpener2.distanceToGo() != 0)
    {
      catcherOpener1.run();
      catcherOpener2.run();
    }
  }
  else
  {
    all_axis_homing();
  }
}

void s1_s2_catcher_close()
{

  while (digitalRead(s_catcher_opener1_home_sensor) == LOW || digitalRead(s_catcher_opener2_home_sensor) == LOW)
  {

    if (digitalRead(s_catcher_opener1_home_sensor) == LOW)
    {
      catcherOpener1.setSpeed(-4000);
      catcherOpener1.runSpeed();
    }

    if (digitalRead(s_catcher_opener2_home_sensor) == LOW)
    {
      catcherOpener2.setSpeed(4000);
      catcherOpener2.runSpeed();
    }
  }

  catcherOpener1.setCurrentPosition(0);
  catcherOpener2.setCurrentPosition(0);
}

void puri_push_drill_down()
{

  if (digitalRead(puri_catcher_home_sensor) == HIGH && digitalRead(drill_home_sensor) == HIGH)
  {

    puriCatcher.moveTo(12500);
    puriDrill.moveTo(7000);

    digitalWrite(drill_motor, HIGH);

    while (puriCatcher.distanceToGo() != 0 || puriDrill.distanceToGo() != 0)
    {
      if (puriCatcher.distanceToGo() != 0)
      {
        puriCatcher.setSpeed(4000);
        puriCatcher.runSpeed();
      }
      if (puriDrill.distanceToGo() != 0)
      {
        puriDrill.setSpeed(4000);
        puriDrill.runSpeed();
      }
    }
  }
  else
  {
    all_axis_homing();
  }
}

void cup_dispense()
{
  while (digitalRead(cup_detect_ir) == HIGH)
  {
    digitalWrite(cup_dispensor_motor, HIGH);
  }
  digitalWrite(cup_dispensor_motor, LOW);
  delay(100);
}

void conveyor()
{

  puriConveyor.setSpeed(4000);

  while (digitalRead(conveyor_home_sensor) == HIGH)
  {
    puriConveyor.runSpeed();
  }

  while (digitalRead(conveyor_home_sensor) == LOW)
  {
    puriConveyor.runSpeed();
  }

  puriConveyor.stop();
  puriConveyor.setCurrentPosition(0);
}

void plate_vaccum_on()
{
  digitalWrite(plate_vaccum, HIGH);
}

void plate_vaccum_off()
{
  digitalWrite(plate_vaccum, LOW);
}

void puri_barrel_rotor()
{
  if (digitalRead(puri_catcher_home_sensor) == HIGH)
  {
    while (digitalRead(ir) == HIGH)
    {
      puriBarrel.move(500);       // Move 2200 steps forward
      puriBarrel.runToPosition(); // Run to the new position
      delay(200);                 // Add a small delay to prevent rapid cycling
    }
  }

  // Ensuring the puri dropper can operate again by resetting its position
  if (digitalRead(puri_catcher_home_sensor) == LOW || digitalRead(ir) == LOW)
  {
    puriBarrel.setCurrentPosition(0); // Reset position for puriBarrel
  }
}

void plate_rotate()
{
  plateRotor.setCurrentPosition(0);
  plateRotor.move(35);

  while (plateRotor.distanceToGo() != 0)
  {
    plateRotor.run();
  }
}

void water_refill()
{
  if (digitalRead(water_tank_float_sensor) == LOW)
  {
    while (digitalRead(water_tank_float_sensor) == LOW)
    {
      digitalWrite(water_refill_pump, HIGH);
    }

    digitalWrite(water_refill_pump, LOW);
  }
  else
  {
    digitalWrite(water_refill_pump, LOW);
  }
}

void plate_cup_fwd_till_customer()
{
  pcHorizontal.moveTo(-7000);

  while (pcHorizontal.distanceToGo() != 0)
  {
    pcHorizontal.run();
  }

  delay(100);

  plate_vaccum_off();

  while (digitalRead(plate_detect_ir) == LOW || digitalRead(cup_detect_ir) == LOW)
  {
  }
}

/* puri 1 functions */

void puri_push_s_catcher_open1_plate_cup_up()
{

  plate_vaccum_on();

  if (digitalRead(puri_catcher_home_sensor) == HIGH && digitalRead(s_catcher_opener1_home_sensor) == HIGH && digitalRead(plate_cup_vertical_home_sensor) == HIGH)
  {
    puriCatcher.moveTo(12500);
    catcherOpener1.moveTo(5000);
    pcVertical.moveTo(36400);

    while (puriCatcher.distanceToGo() != 0 || catcherOpener1.distanceToGo() != 0 || pcVertical.distanceToGo() != 0)
    {
      if (puriCatcher.distanceToGo() != 0)
      {
        puriCatcher.setSpeed(4000);
        puriCatcher.runSpeed();
      }

      if (catcherOpener1.distanceToGo() != 0)
      {
        catcherOpener1.setSpeed(4000);
        catcherOpener1.runSpeed();
      }

      if (pcVertical.distanceToGo() != 0)
      {
        pcVertical.setSpeed(5500);
        pcVertical.runSpeed();
      }
    }

    cup_dispense();
  }
  else
  {
    all_axis_homing();
  }
}

void blower_plate_cup_down()
{
  unsigned long function_call_millis = millis();

  while (millis() - function_call_millis < 5000 || digitalRead(plate_cup_vertical_home_sensor) == LOW)
  {

    if (millis() - function_call_millis < 2500)
    {
      analogWrite(blower_pwm, 255);
    }

    if (millis() - function_call_millis > 2505 && millis() - function_call_millis < 4000)
    {
      analogWrite(blower_pwm, 0);
      digitalWrite(blower_solenoid, HIGH);
    }

    if (millis() - function_call_millis > 4005)
    {
      digitalWrite(blower_solenoid, LOW);
    }

    if (digitalRead(plate_cup_vertical_home_sensor) == LOW)
    {
      pcVertical.setSpeed(-5500);
      pcVertical.runSpeed();
    }
  }

  function_call_millis = 0;

  pcVertical.setCurrentPosition(0);
}

void puri_pull_s_catcher_close1_plate_cup_fwd_till_masala()
{

  pcHorizontal.moveTo(-5400);

  while (pcHorizontal.distanceToGo() != 0 || digitalRead(puri_catcher_home_sensor) == LOW || digitalRead(s_catcher_opener1_home_sensor) == LOW)
  {
    if (pcHorizontal.distanceToGo() != 0)
    {
      pcHorizontal.setSpeed(4000);
      pcHorizontal.runSpeedToPosition();
    }

    if (digitalRead(puri_catcher_home_sensor) == LOW)
    {
      puriCatcher.setSpeed(-4000);
      puriCatcher.runSpeed();
    }

    if (digitalRead(s_catcher_opener1_home_sensor) == LOW)
    {
      catcherOpener1.setSpeed(-4000);
      catcherOpener1.runSpeed();
    }
  }

  puriCatcher.setCurrentPosition(0);
  catcherOpener1.setCurrentPosition(0);
  pcHorizontal.setCurrentPosition(0);
}

void puri_1_parallel()
{
  puri_barrel_rotor();
  delay(100);
  puri_push_s_catcher_open1_plate_cup_up();
  delay(100);
  blower_plate_cup_down();
  delay(100);
  puri_pull_s_catcher_close1_plate_cup_fwd_till_masala();
}

/* puri 2 functions */

void puri_push_s_catcher_open1()
{
  if (digitalRead(puri_catcher_home_sensor) == HIGH && digitalRead(s_catcher_opener1_home_sensor) == HIGH)
  {

    puriCatcher.moveTo(12500);
    catcherOpener1.moveTo(5000);

    while (puriCatcher.distanceToGo() != 0 || catcherOpener1.distanceToGo() != 0)
    {
      if (puriCatcher.distanceToGo() != 0)
      {
        puriCatcher.setSpeed(4000);
        puriCatcher.runSpeed();
      }

      if (catcherOpener1.distanceToGo() != 0)
      {
        catcherOpener1.setSpeed(4000);
        catcherOpener1.runSpeed();
      }
    }
  }
  else
  {
    all_axis_homing();
  }
}

void blower_on_off_drill_down()
{
  unsigned long function_call_millis = millis();

  puriDrill.moveTo(7000);

  while (millis() - function_call_millis < 5000 || puriDrill.distanceToGo() != 0)
  {

    if (millis() - function_call_millis < 2500)
    {
      analogWrite(blower_pwm, 255);
    }

    if (millis() - function_call_millis > 2505 && millis() - function_call_millis < 4000)
    {
      analogWrite(blower_pwm, 0);
      digitalWrite(blower_solenoid, HIGH);
    }
    if (millis() - function_call_millis > 4005)
    {
      digitalWrite(blower_solenoid, LOW);
    }

    if (puriDrill.distanceToGo() != 0)
    {

      digitalWrite(drill_motor, HIGH);
      puriDrill.setSpeed(4000);
      puriDrill.runSpeed();
    }
  }

  function_call_millis = 0;
}

void puri_pull_drill_up_s_catcher_close1()
{

  while (digitalRead(puri_catcher_home_sensor) == LOW || digitalRead(drill_home_sensor) == LOW || digitalRead(s_catcher_opener1_home_sensor) == LOW)
  {

    if (digitalRead(puri_catcher_home_sensor) == LOW)
    {
      puriCatcher.setSpeed(-4000);
      puriCatcher.runSpeed();
    }
    if (digitalRead(drill_home_sensor) == LOW)
    {
      puriDrill.setSpeed(-4000);
      puriDrill.runSpeed();
    }
    if (digitalRead(s_catcher_opener1_home_sensor) == LOW)
    {
      catcherOpener1.setSpeed(-4000);
      catcherOpener1.runSpeed();
    }
  }

  digitalWrite(drill_motor, LOW);

  puriCatcher.setCurrentPosition(0);
  puriDrill.setCurrentPosition(0);
  catcherOpener1.setCurrentPosition(0);
}

void puri_2_parallel()
{
  puri_barrel_rotor();
  delay(100);
  puri_push_s_catcher_open1();
  delay(100);
  blower_on_off_drill_down();
  delay(100);
  puri_pull_drill_up_s_catcher_close1();
}

/* puri 3-5 functions */

void puri_push_s_catcher_open1_masala_s_catcher_open2()
{

  unsigned long function_call_millis = millis();

  if (digitalRead(puri_catcher_home_sensor) == HIGH && digitalRead(s_catcher_opener1_home_sensor) == HIGH && digitalRead(s_catcher_opener2_home_sensor) == HIGH)
  {

    puriCatcher.moveTo(12500);
    catcherOpener1.moveTo(5000);
    catcherOpener2.moveTo(-5000);

    while (puriCatcher.distanceToGo() != 0 || catcherOpener1.distanceToGo() != 0 || catcherOpener2.distanceToGo() != 0 || millis() - function_call_millis < 4000)
    {
      if (puriCatcher.distanceToGo() != 0)
      {
        puriCatcher.setSpeed(4000);
        puriCatcher.runSpeed();
      }

      if (catcherOpener1.distanceToGo() != 0)
      {
        catcherOpener1.setSpeed(4000);
        catcherOpener1.runSpeed();
      }

      if (catcherOpener2.distanceToGo() != 0 && millis() - function_call_millis > 1600)
      {
        catcherOpener2.setSpeed(-4000);
        catcherOpener2.runSpeedToPosition();
      }

      if (millis() - function_call_millis < 1000)
      {
        digitalWrite(alu, HIGH);
        digitalWrite(onion, HIGH);
      }

      if (millis() - function_call_millis > 1005 && millis() - function_call_millis < 1500)
      {
        digitalWrite(alu, LOW);
        digitalWrite(onion, LOW);

        digitalWrite(sev, HIGH);
        digitalWrite(channa, HIGH);
      }

      if (millis() - function_call_millis > 1505)
      {
        digitalWrite(sev, LOW);
        digitalWrite(channa, LOW);
      }
    }

    function_call_millis = 0;
  }
  else
  {
    all_axis_homing();
  }
}

/* use blower_on_off_drill_down from puri 2 */

void puri_pull_drill_up_s_catcher_close1_s_catcher_close2()
{

  while (digitalRead(puri_catcher_home_sensor) == LOW || digitalRead(drill_home_sensor) == LOW || digitalRead(s_catcher_opener1_home_sensor) == LOW || digitalRead(s_catcher_opener2_home_sensor) == LOW)
  {

    if (digitalRead(puri_catcher_home_sensor) == LOW)
    {
      puriCatcher.setSpeed(-4000);
      puriCatcher.runSpeed();
    }
    if (digitalRead(drill_home_sensor) == LOW)
    {
      puriDrill.setSpeed(-4000);
      puriDrill.runSpeed();
    }
    if (digitalRead(s_catcher_opener1_home_sensor) == LOW)
    {
      catcherOpener1.setSpeed(-4000);
      catcherOpener1.runSpeed();
    }

    if (digitalRead(s_catcher_opener2_home_sensor) == LOW)
    {
      catcherOpener2.setSpeed(4000);
      catcherOpener2.runSpeed();
    }
  }

  digitalWrite(drill_motor, LOW);

  puriCatcher.setCurrentPosition(0);
  puriDrill.setCurrentPosition(0);
  catcherOpener1.setCurrentPosition(0);
  catcherOpener2.setCurrentPosition(0);

  plate_rotate();
}

void puri_3_to_5_parallel()
{
  puri_barrel_rotor();
  delay(100);
  puri_push_s_catcher_open1_masala_s_catcher_open2();
  delay(100);
  blower_on_off_drill_down();
  delay(100);
  puri_pull_drill_up_s_catcher_close1_s_catcher_close2();
}

/* puri 6 functions */

void drill_down_up_masala_s_catcher_open2_close2_pani()
{

  unsigned long function_call_millis = millis();

  puriDrill.moveTo(7000);
  catcherOpener2.moveTo(-5000);

  while (puriDrill.distanceToGo() != 0 || catcherOpener2.distanceToGo() != 0 || millis() - function_call_millis < 8000)
  {

    if (puriDrill.distanceToGo() != 0)
    {
      digitalWrite(drill_motor, HIGH);
      puriDrill.setSpeed(4000);
      puriDrill.runSpeed();
    }

    if (millis() - function_call_millis < 1000)
    {
      digitalWrite(spicy_flavor, HIGH);
    }

    if (millis() - function_call_millis > 1005 && millis() - function_call_millis < 6500)
    {
      digitalWrite(spicy_flavor, LOW);

      digitalWrite(spicy_sol, HIGH);
      digitalWrite(spicy_mixer, HIGH);
    }

    if (millis() - function_call_millis > 6505)
    {
      digitalWrite(spicy_sol, LOW);
      digitalWrite(spicy_mixer, LOW);
    }

    if (millis() - function_call_millis < 2000)
    {
      digitalWrite(alu, HIGH);
      digitalWrite(onion, HIGH);
    }

    if (millis() - function_call_millis > 2005 && millis() - function_call_millis < 3000)
    {
      digitalWrite(alu, LOW);
      digitalWrite(onion, LOW);

      digitalWrite(sev, HIGH);
      digitalWrite(channa, HIGH);
    }

    if (millis() - function_call_millis > 3100 && catcherOpener2.distanceToGo() != 0)
    {

      digitalWrite(sev, LOW);
      digitalWrite(channa, LOW);

      catcherOpener2.setSpeed(-4000);
      catcherOpener2.runSpeedToPosition();
    }
  }

  while (digitalRead(drill_home_sensor) == LOW || digitalRead(s_catcher_opener2_home_sensor) == LOW)
  {
    if (digitalRead(drill_home_sensor) == LOW)
    {
      digitalWrite(drill_motor, LOW);
      puriDrill.setSpeed(-4000);
      puriDrill.runSpeed();
    }

    if (digitalRead(s_catcher_opener2_home_sensor) == LOW)
    {
      catcherOpener2.setSpeed(4000);
      catcherOpener2.runSpeed();
    }
  }

  plate_rotate();

  puriDrill.setCurrentPosition(0);
  catcherOpener2.setCurrentPosition(0);
}

void masala()
{

  digitalWrite(alu, HIGH);
  digitalWrite(onion, HIGH);
  delay(2000);
  digitalWrite(alu, LOW);
  digitalWrite(onion, LOW);

  digitalWrite(channa, HIGH);
  digitalWrite(sev, HIGH);
  delay(1000);
  digitalWrite(channa, LOW);
  digitalWrite(sev, LOW);
}

void s_catcher_open2()
{
  if (digitalRead(s_catcher_opener2_home_sensor) == HIGH)
  {

    // Move forward
    catcherOpener2.moveTo(-5000);
    while (catcherOpener2.distanceToGo() != 0)
    {
      catcherOpener2.run();
    }
  }
}

void s_catcher_close2()
{
  if (digitalRead(s_catcher_opener2_home_sensor) == LOW)
  {
    catcherOpener2.setSpeed(4000);
    while (digitalRead(s_catcher_opener2_home_sensor) == LOW)
    {
      catcherOpener2.runSpeed();
    }

    catcherOpener2.stop();
    delay(200);
    catcherOpener2.setCurrentPosition(0); // Reset position at home
  }

  plate_rotate();
}

void puri_6_parallel()
{
  puri_barrel_rotor();
  delay(100);
  puri_push_s_catcher_open1_masala_s_catcher_open2(); // puri 6 @ st1 puri 4 --> out
  delay(100);
  blower_on_off_drill_down();
  delay(100);
  puri_pull_drill_up_s_catcher_close1_s_catcher_close2();
  delay(100);
  conveyor(); // puri 5 @ station 3 puri 6 @ station 2
  delay(100);
  drill_down_up_masala_s_catcher_open2_close2_pani();
  delay(100);
  conveyor(); // puri 6 @ station 3
  delay(100);
  masala();
  delay(100);
  s_catcher_open2();
  delay(100);
  s_catcher_close2();
}