
function add(a, b) {
  return a + b;
}

const result = add(10, 20);

if (result === 30) {
  console.log("TEST SUCCESS!");
} else {
  throw new Error("TEST FAILED!");
}
