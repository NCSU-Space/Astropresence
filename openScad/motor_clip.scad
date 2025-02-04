difference() {
  union() {
    cube([6,6,8]);
/*    translate([0,4,0]) {
      cube([4,2,8]);
    }*/
    
    cube([25,1,4]);
    translate([0,5,0]) {
      cube([25,1,4]);
    }
  }
  translate([3,3,-1]) {
    cylinder(h = 14, d = 3.9, $fn=12);
  }
}

translate([25,0,0]) {
  polyhedron(points = [[0,0,0],[0,6,0],[0,0,4],[0,6,4],[1,-2,0],[1,8,0],[1,-2,10],[1,8,10]], faces = [[0,1,2],[1,2,3],[0,2,4],[2,4,6],[1,3,5],[3,5,7],[0,1,4],[1,4,5],[2,3,6],[3,6,7],[4,5,6],[5,6,7]]);
  translate([1,-2,0]) {
    cube([1,10,10]);
  }
}