let x = [];
let y = [];

//Longitudes de los segmentos del brazo
const L1 = 5;
const L2 = 4;
const L3 = 2;

let armDOWN = false;

const ikUpBtn = document.getElementById("ikUp");
const ikDownBtn = document.getElementById("ikDown");

let rotationInterval = null;
let rotationSpeed = 10;

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

function toDegrees(radians) {
    return radians * (180 / Math.PI);
}

function forwardKinematics(theta1, theta2, theta3){

    const fixedTheta1 = toRadians(theta1);
    const fixedTheta2 = toRadians(theta2);
    const fixedTheta3 = toRadians(theta3);

    const x1 = L1 * Math.cos(fixedTheta1);
    const y1 = L1 * Math.sin(fixedTheta1);

    const x2 = x1 + L2 * Math.cos(fixedTheta1 + fixedTheta2);
    const y2 = y1 + L2 * Math.sin(fixedTheta1 + fixedTheta2);

    const x3 = x2 + L3 * Math.cos(fixedTheta1 + fixedTheta2 + fixedTheta3);
    const y3 = y2 + L3 * Math.sin(fixedTheta1 + fixedTheta2 + fixedTheta3);
    
    return [
        {x: 0, y: 0}, {x: x1, y: y1}, {x: x2, y: y2}, {x: x3, y: y3}
      ];
}

function inverseKinematics(x,y,angle, armDOWN){

    const phi = toRadians(angle);

    const wristX = x - L3 * Math.cos(phi);
    const wristY = y - L3 * Math.sin(phi);

    const distanceSquare = wristX * wristX + wristY * wristY;

    const distance = Math.sqrt(distanceSquare);

    let direction = (distanceSquare - (L1 * L1) - (L2 * L2)) / (2 * L1 * L2);

    if (distance > L1 + L2 + L3) {
      return null;
    }

    direction = Math.max(-1, Math.min(1, direction));

    const s2Magnitude = Math.sqrt(Math.max(0,1 -(direction  * direction)));

    let s2;

    if(armDOWN){
      s2 = s2Magnitude;
    }else{
      s2 = -s2Magnitude;
    }

    let theta2 = Math.atan2(s2, direction);

    const k1 = L1 + L2 * direction;
    const k2 = L2 * s2;

    let theta1 = Math.atan2(wristY,wristX) - Math.atan2(k2,k1);

    let theta3 = phi - theta1 - theta2;

    return [
      toDegrees(theta1),
      toDegrees(theta2),
      toDegrees(theta3)
    ]

}

let points = forwardKinematics(0, 0, 0);

const datasets = [

    {
      label: "Joint 1",
      data: [points[0], points[1]],
      borderColor: "red",
      backgroundColor: "red",
      fill: false,
      showLine: true,
      pointRadius: 5
    },
    {
      label: "Joint 2",
      data: [points[1], points[2]],
      borderColor: "lime",
      backgroundColor: "lime",
      fill: false,
      showLine: true,
      pointRadius: 5
    },
    {
      label: "Joint 3",
      data: [points[2], points[3]],
      borderColor: "blue",
      backgroundColor: "blue",
      fill: false,
      showLine: true,
      pointRadius: 5
    }

];

function moveToXY() {
  const x = parseFloat(document.getElementById("xInput").value);
  const y = parseFloat(document.getElementById("yInput").value);
  const rot = parseFloat(document.getElementById("rotInput").value);

  const angles = inverseKinematics(x, y, rot, armDOWN);

  if (angles) {
    const [t1, t2, t3] = angles;

    document.getElementById("theta1").value = t1;
    document.getElementById("theta2").value = t2;
    document.getElementById("theta3").value = t3;

    document.getElementById("theta1Input").value = t1.toFixed(2);
    document.getElementById("theta2Input").value = t2.toFixed(2);
    document.getElementById("theta3Input").value = t3.toFixed(2);

    document.getElementById("val1").innerText = t1.toFixed(2);
    document.getElementById("val2").innerText = t2.toFixed(2);
    document.getElementById("val3").innerText = t3.toFixed(2);

    updateArm();

  } else {
    alert("This position is out of bonds!");
  }
}

function toPosition(t1, t2, t3){

  document.getElementById("theta1").value = t1;
  document.getElementById("theta2").value = t2;
  document.getElementById("theta3").value = t3;

  document.getElementById("theta1Input").value = t1;
  document.getElementById("theta2Input").value = t2;
  document.getElementById("theta3Input").value = t3;

  document.getElementById("val1").innerText = t1;
  document.getElementById("val2").innerText = t2;
  document.getElementById("val3").innerText = t3;

  updateArm();
}

function rotateEndEffector(direction) {
  if (rotationInterval) return;

  rotationInterval = setInterval(() => {
    let t3 = parseFloat(document.getElementById("theta3").value);
    t3 += direction * rotationSpeed;

    if (t3 > 180) t3 = -180;
    if (t3 < -180) t3 = 180;

    document.getElementById("theta3").value = t3;
    document.getElementById("theta3Input").value = t3;
    document.getElementById("val3").innerText = t3;

    updateArm();
  }, 50);
}

function stopRotation() {
  clearInterval(rotationInterval);
  rotationInterval = null;
}

let armChart = new Chart("arm", {
    type: "scatter",
    data: { datasets: datasets },
    options: {
      title: {
        display: true,
        text: "Arm simulation 3DOF",
        fontSize: 18
      },
      responsive: false,
      maintainAspectRatio: false,
      aspectRatio: 1,
      scales: {
        xAxes: [{
          ticks: { min: -(L1+L2+L3 + 2), max: L1+L2+L3 + 2},
          scaleLabel: { display: true, labelString: "X" }
        }],
        yAxes: [{
          ticks: { min: -(L1+L2+L3 + 2), max: L1+L2+L3 + 2},
          scaleLabel: { display: true, labelString: "Y" }
        }]
      }
    }
});

ikUpBtn.addEventListener("click", () => {
  armDOWN = false;
  ikUpBtn.classList.add("active");
  ikDownBtn.classList.remove("active");
});

ikDownBtn.addEventListener("click", () => {
  armDOWN = true;
  ikDownBtn.classList.add("active");
  ikUpBtn.classList.remove("active");
});

document.getElementById("theta1").addEventListener("input", updateArm);
document.getElementById("theta2").addEventListener("input", updateArm);
document.getElementById("theta3").addEventListener("input", updateArm);

document.getElementById("theta1Input").addEventListener("input", function() {
  document.getElementById("theta1").value = this.value;
  updateArm();
});
document.getElementById("theta2Input").addEventListener("input", function() {
  document.getElementById("theta2").value = this.value;
  updateArm();
});
document.getElementById("theta3Input").addEventListener("input", function() {
  document.getElementById("theta3").value = this.value;
  updateArm();
});

function updatePositionFromAngles() {
  
  const t1 = parseFloat(document.getElementById("theta1").value);
  const t2 = parseFloat(document.getElementById("theta2").value);
  const t3 = parseFloat(document.getElementById("theta3").value);

  const points = forwardKinematics(t1, t2, t3);
  const endEffector = points[3];

  document.getElementById("valX").innerText = endEffector.x.toFixed(2);
  document.getElementById("valY").innerText = endEffector.y.toFixed(2);
  document.getElementById("valRot").innerText = (t1 + t2 + t3).toFixed(2);
}

function updateArm() {

  const t1 = parseFloat(document.getElementById("theta1").value);
  const t2 = parseFloat(document.getElementById("theta2").value);
  const t3 = parseFloat(document.getElementById("theta3").value);

  document.getElementById("val1").innerText = t1;
  document.getElementById("val2").innerText = t2;
  document.getElementById("val3").innerText = t3;

  document.getElementById("theta1Input").value = t1;
  document.getElementById("theta2Input").value = t2;
  document.getElementById("theta3Input").value = t3;

  const points = forwardKinematics(t1, t2, t3);

  armChart.data.datasets[0].data = [points[0], points[1]];
  armChart.data.datasets[1].data = [points[1], points[2]];
  armChart.data.datasets[2].data = [points[2], points[3]]; 

  armChart.update();

  updatePositionFromAngles();
}


