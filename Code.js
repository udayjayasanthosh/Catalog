const readline = require('readline');

// Setup CLI reader
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// console.log("Enter the JSON input, then press CTRL+Z (Windows) or CTRL+D (Linux/Mac) to finish:");

// Read JSON string from stdin
let rawData = '';
rl.on('line', line => {
    rawData += line.trim();
}).on('close', () => {
    try {
        // Parse JSON from user
        const jsonInput = JSON.parse(rawData);

        const totalPoints = jsonInput.keys.n;
        const minPoints = jsonInput.keys.k;
        const degree = minPoints - 1;

        // Convert JSON to array of points
        const allPoints = Object.entries(jsonInput)
            .filter(([key]) => key !== 'keys')
            .map(([xStr, obj]) => {
                const xVal = BigInt(xStr);
                const baseVal = parseInt(obj.base, 10);
                const yDecoded = BigInt(parseInt(obj.value, baseVal));
                return { x: xVal, y: yDecoded };
            });

        if (allPoints.length < minPoints) {
            console.error("Not enough points to solve the polynomial.");
            process.exit(1);
        }

        // Choose first k points (can be randomized if needed)
        const selectedPoints = allPoints.slice(0, minPoints);

        // Build coefficient matrix and results vector
        const matrix = [];
        const results = [];

        selectedPoints.forEach(pt => {
            const row = [];
            for (let p = degree; p >= 0; p--) {
                row.push(pt.x ** BigInt(p));
            }
            matrix.push(row);
            results.push(pt.y);
        });

        // Solve using Gaussian elimination with BigInt
        function solveSystem(mat, vec) {
            const size = mat.length;

            for (let i = 0; i < size; i++) {
                // Find pivot
                let pivotRow = i;
                for (let r = i + 1; r < size; r++) {
                    if (mat[r][i] > mat[pivotRow][i]) {
                        pivotRow = r;
                    }
                }

                // Swap rows if needed
                [mat[i], mat[pivotRow]] = [mat[pivotRow], mat[i]];
                [vec[i], vec[pivotRow]] = [vec[pivotRow], vec[i]];

                // Normalize pivot row
                const pivotVal = mat[i][i];
                for (let col = i; col < size; col++) {
                    mat[i][col] = mat[i][col] / pivotVal;
                }
                vec[i] = vec[i] / pivotVal;

                // Eliminate other rows
                for (let r = 0; r < size; r++) {
                    if (r !== i) {
                        const factor = mat[r][i];
                        for (let col = i; col < size; col++) {
                            mat[r][col] -= factor * mat[i][col];
                        }
                        vec[r] -= factor * vec[i];
                    }
                }
            }
            return vec;
        }

        const coeffs = solveSystem(matrix, results);

        // Output
        // console.log("Polynomial Coefficients:", coeffs.map(c => c.toString()));
        console.log("Secret term (c):", coeffs[coeffs.length - 1].toString());

    } catch (err) {
        console.error("Invalid JSON format or processing error:", err.message);
    }
});