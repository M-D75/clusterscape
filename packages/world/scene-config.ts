/** Paramètres de présentation uniquement ; jamais des capacités ni un équipement physique. */
export const communicationStyle={offset:[0,0,0] as [number,number,number],radius:.8,height:.65};

/** Avant fixe = projection XZ de la caméra initiale (.48, .72, .5).
 * Les entrées regardent le centre ; la profondeur croît dans la direction opposée. */
export const fanLayout={openingDegrees:145,backAngle:Math.atan2(-.48,-.5),innerRadius:9,columns:4,pitch:3.8,sidePadding:2,frontPadding:3.2,rearPadding:2,zoneGap:2.5,growthStep:1};
