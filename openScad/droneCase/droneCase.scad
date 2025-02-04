//Create object definitions


/*
This module defines a finger case to cover a particular 2D rectangle.  It also allows you to define the finger length, width and the thickness of the walls.
@param input2DObjectToCoverDimensions: This is a 2 element array describing the length and width of the 2D object the finger case will exactly fit around.
@param inputFingerLength: The length of the fingers coming up from the base
@param inputFingerWidth: How wide the fingers should be (can't be wider than the case sides).
@param inputWallThickness: A 3 element array describing how thick the walls should be in the X, Y and Z sides
*/
module fingerCase(input2DObjectToCoverDimensions, inputFingerLength, inputFingerWidth, inputWallThickness)
{
baseDimensions = [input2DObjectToCoverDimensions[0]+inputWallThickness[0]*2, input2DObjectToCoverDimensions[1]+inputWallThickness[1]*2,inputFingerLength + inputWallThickness[2]];

module baseShape()
{
//Make the shape to subtract from
cube(baseDimensions);
}

module materialToRemoveForShell()
{
translate(inputWallThickness)
cube(baseDimensions - inputWallThickness*2 + [0,0,inputWallThickness[2]]);
}

module cornerMaterialToRemove()
{
cube([baseDimensions[0]/2-inputFingerWidth/2, baseDimensions[1]/2-inputFingerWidth/2, baseDimensions[2]+.001]);
}




difference()
{
baseShape();

//Make the shapes to take away

//Subtract material to make the shell
materialToRemoveForShell();

//Corners
translate([0,0,0])
cornerMaterialToRemove();

translate([baseDimensions[0]/2+inputFingerWidth/2,0,0])
cornerMaterialToRemove();


translate([0,baseDimensions[1]/2+inputFingerWidth/2,0])
cornerMaterialToRemove();

translate([baseDimensions[0]/2+inputFingerWidth/2, baseDimensions[1]/2+inputFingerWidth/2,0])
cornerMaterialToRemove();
}

}

//Make fitted box module
/*
This module allows the creation of a box of a particular size that will hold another object that is smaller than it
@param input2DObjectToCoverDimensions: This is a 2 element array describing the length and width of the 2D object the box will exactly fit around.
@param inputBoxDimensions: This is a 3 element array describing the outer dimensions of the box
@param inputHolderWidth: This is how wide the elements holding the internal object are
@param inputWallThickness: This is how thick the base and sides of the box are 
*/
module fittedBox(input2DObjectToCoverDimensions, inputBoxDimensions, inputHolderWidth, inputWallThickness)
{
//Calculate how tall the internal object is
internalObjectHeight = inputBoxDimensions[2]- inputWallThickness;

union()
{

difference()
{
//Make a solid block the size of the box
cube(inputBoxDimensions);

//Subtract the internal space for the object
translate([inputWallThickness,inputWallThickness,inputWallThickness])
cube([inputBoxDimensions[0] - inputWallThickness*2, inputBoxDimensions[1] - inputWallThickness*2, inputBoxDimensions[2] - inputWallThickness]);
}


translate([0,0,inputWallThickness])
fingerCase(input2DObjectToCoverDimensions, internalObjectHeight, inputHolderWidth, [(inputBoxDimensions[0] - input2DObjectToCoverDimensions[0])/2, (inputBoxDimensions[1] - input2DObjectToCoverDimensions[1])/2, 0]);


}

}


//Instantiate objects

fingerWidth = 2;
wallThickness = 2;


//Make box for ODroid and battery

ODroid2DDimensions = [49,85];
//ODroidBoxDimensions = [55,90,30];
ODroidBoxDimensions = [67,90,30];

translate([-110,0,0])
fittedBox(ODroid2DDimensions, ODroidBoxDimensions, fingerWidth, wallThickness);


batteryDimensions = [36,71];
batteryBoxDimensions = [45,90,30];

translate([-45,0,0])
fittedBox(batteryDimensions, batteryBoxDimensions, fingerWidth, wallThickness);


//fingerCase(thingToCover2DDimensions, fingerLength, fingerWidth, xyzWallThickness); 




//Motor board box
/*
motorBoard2DDimensions = [69,102];
motorBoardBoxDimensions = [90,110,30];

rotate(90, [0,0,1])
fittedBox(motorBoard2DDimensions, motorBoardBoxDimensions, fingerWidth, wallThickness);
*/


