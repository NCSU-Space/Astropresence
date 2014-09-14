/*
This module defines a cube that has holes on its faces.  This is meant to be used to create structures with a controllable amount of holes.  The idea is that you specify a hole radius/spacing and the module makes a prism that has the appropriate number of holes and spacing.
@param inputCubeDimensions: A 3 element array defining the length, width and breadth of the prism
@param inputHoleDiameter: The diameter of the holes to put in the cube
@param inputHoleSpacing: The center to center distance between adjacent holes in the cube
@param inputDirectionToPutHoles: A 3 element array defining which of the axises should have holes (a 1 indicates that holes should be placed) 
*/

module cubeWithHoles(inputCubeDimensions, inputHoleDiameter = 1, inputHoleSpacing = 2, inputDirectionToPutHoles = [1,1,1])
{
cube(inputCubeDimensions);

//For each of the defined axises, insert the required
counter = 0;
for(i = [0:2])
{

if(inputDirectionToPutHoles[i] == 1)
{
//Put in the holes for this axis (xy, yz, zx)
testThisThing = i % 3.0;
testThisThing2 = inputCubeDimensions[(i+1) % 3];
twoDDimensions = [inputCubeDimensions[counter%3], inputCubeDimensions[(counter+1)%3]];


//Determine how many holes in the two dimensions
//numberOfHoles = [floor(twoDimensions[0]/inputCubeDimensions)-1, floor(twoDimensions[0]/inputCubeDimensions)-1)];


}

}

}

cubeWithHoles([10, 10, 10]);

