#include <OneWire.h>
#include <NewSoftSerial.h>


/* TEMP SECTION */
float OldTemp = 0;
OneWire ds(9); // on pin 9
long PreviousTempMillis = 0;
long TempInterval = 5000; //how often to send temp; (1 min)


/* RFID SECTION */
String tag;
String LastTag;
String CurrentTag;
int rxPin = 12;
int txPin = 10;
int enable = 11;
int bytesread = 0;
int val = 0;
//char code[10];
NewSoftSerial RFID(rxPin,txPin);


/* SOLENOID SECTION */
int solenoid = 2; //Solenoid Pin


/* FLOW SECTION */
volatile int NbTopsFan;
int Calc;
int hallsensor = 3;

/* SERIAL SECTION */
String SIN; //Serial In
int SVAL;


void setup(void) {
  Serial.begin(9600);

  pinMode(hallsensor, INPUT); //initializes digital pin 2 as an input
  attachInterrupt(1, rpm, RISING); //and the interrupt is attached
  pinMode(enable,OUTPUT);
  pinMode(solenoid, OUTPUT);
  digitalWrite(solenoid, LOW);
  digitalWrite(enable, LOW);
  RFID.begin(2400);
  //DisplayTemp();
}

void loop(void) {
 unsigned long CurrentTempMillis = millis();
  RFID.begin(2400);
 
  if (RFID.available()){
    DisplayTag();
  }
  
  if(CurrentTempMillis - PreviousTempMillis > TempInterval) {
    PreviousTempMillis = CurrentTempMillis;
    DisplayTemp();
    LastTag=0;
  }
 
  if(Serial.available() > 0){
    delay(50); //stupid serial lib
    bytesread = 0;
    SIN =""; //serial in
    // Need to Check first 10 Bytes for a "**REQUEST_"
    while(bytesread<10){
      SVAL = Serial.read();
      SIN = SIN + byte(SVAL);
      bytesread++;
    }
    if((bytesread == 10) && (SIN == "**REQUEST_"))
    {
      bytesread = 0;
      SIN = "";
      while(bytesread<6){
        SVAL = Serial.read();
        SIN = SIN + byte(SVAL);
        bytesread++;
      }
      if (SIN == "OPEN**") {
        ValidUser();
        Serial.begin(9600);
        RFID.flush();
      }
    }
  }
}


void DisplayTag(){
   delay(200);
   if((val = RFID.read()) == 10){ // check for header
   bytesread = 0;
   while(bytesread<10){
      // read 10 digit code
      val = RFID.read();
      if((val == 10)||(val == 13))
      { // if header or stop bytes before the 10 digit reading
        break; // stop reading
      }
      tag = tag + byte(val); // add the digit
      bytesread++; // ready to read next digit
    }

    if(bytesread == 10){
      // if 10 digit read is complete
      CurrentTag = "**TAG_" + tag + "**"; //creating a string to send thorugh serial.
      
      if(CurrentTag != LastTag){
        Serial.println(CurrentTag); // possibly a good TAG  
        delay(5);
        Serial.println(CurrentTag); // Just incase         
      }
      

      LastTag = CurrentTag;
     
      RFID.flush(); // Clear the read buffer
      
      //A Master Tag
      if(tag == "03005A46EA"){
          digitalWrite(solenoid, HIGH);
          delay(11000);
          digitalWrite(solenoid, LOW);
      }
     
     
     
    }
    bytesread = 0;
    tag = "";
    delay(50);
  }
 
}

void DisplayTemp(){
  
byte i;
byte present = 0;
byte data[12];
byte addr[8];
float Temp;
int SameTemp = 0;
  
  if ( !ds.search(addr)) {
    ds.reset_search();
    return;
  }
  /*for( i = 0; i < 8; i++) {
//Serial.print(addr[i], HEX);
//Serial.print(" ");
}*/
  if ( OneWire::crc8( addr, 7) != addr[7]) {
    Serial.print("CRC is not valid!\n");
    return;
  }
  if ( addr[0] != 0x28) {
    Serial.print("Device is not a DS18S20 family device.\n");
    return;
  }

  ds.reset();
  ds.select(addr);
  ds.write(0x44,1); // start conversion, with parasite power on at the end

  delay(1000); // maybe 750ms is enough, maybe not
  // we might do a ds.depower() here, but the reset will take care of it.

  present = ds.reset();
  ds.select(addr);
  ds.write(0xBE); // Read Scratchpad

  for ( i = 0; i < 9; i++) { // we need 9 bytes
    data[i] = ds.read();
    //Serial.print(data[i], HEX);
    //Serial.print(" ");
  }
  Temp=(data[1]<<8)+data[0];//take the two bytes from the response relating to temperature

  Temp=Temp/16;//divide by 16 to get pure celcius readout

  //next line is Fahrenheit conversion
  Temp=Temp*1.8+32; // comment this line out to get celcius
  SameTemp = isEqual(Temp,OldTemp);
  if(SameTemp == false){

  Serial.print("**TEMP_");//output the temperature to serial port
  Serial.print(Temp);
  Serial.println("**");

  }
 
  OldTemp = Temp;

}

void ValidUser(){
  digitalWrite(solenoid, HIGH);
  LastTag = 0;
  int idle = 0;
  int pour = 0;
  int nopour = 0;
  while (idle < 2){
    NbTopsFan = 0; //Set NbTops to 0 ready for calculations
    //sei(); //Enables interrupts
    delay (1000); //Wait 1 second
    //cli(); //Disable interrupts
    Calc = ((NbTopsFan * 60) / 7.5); //(Pulse frequency x 60) / 7.5Q, = flow rate in L/hour
    if (Calc > 0)
    {
       pour++;
    }
    Serial.print("**FLOW_");//output the temperature to serial port
    Serial.print(Calc, DEC);
    Serial.println("**");
    //Serial.print (Calc, DEC); //Prints the number calculated above
    //Serial.print (" L/hour\r\n"); //Prints "L/hour" and returns a new line
    if ((Calc == 0) && (pour > 0))
    {
       idle++;
    }
    if(pour == 0){
      nopour++;
    }
    if(nopour == 6){
     break; 
    }
  }
  digitalWrite(solenoid, LOW);
  Serial.println("**FLOW_END**");
  Serial.println("**TAG_0000000000**"); // Send blank Tag
}


boolean isEqual(float f1, float f2){
  return ( (int)(f1 *100)) == ((int)(f2 * 100) );
}


void rpm (){ //This is the function that the interupt calls
  NbTopsFan++; //This function measures the rising and falling edge of the hall effect sensors signal
}
