// Define 8085 Registers
const registers = {
    A: 0x00,
    B: 0x00,
    C: 0x00,
    D: 0x00,
    E: 0x00,
    H: 0x00,
    L: 0x00,
    SP: 0xFFFF, // Stack Pointer
    PC: 0x0000  // Program Counter
};

// Define Flags
const flags = {
    Z: 0,  // Zero flag
    S: 0,  // Sign flag
    P: 0,  // Parity flag
    CY: 0, // Carry flag
    AC: 0  // Auxiliary Carry flag
};

// Memory
const memory = new Array(65536).fill(0x00);

// Load memory from local storage if available
if (localStorage.getItem('memory')) {
    const storedMemory = JSON.parse(localStorage.getItem('memory'));
    for (let i = 0; i < storedMemory.length; i++) {
        memory[i] = storedMemory[i];
    }
}

// Function to fetch the next instruction
function fetch() {
    const opcode = memory[registers.PC];
    registers.PC = (registers.PC + 1) & 0xFFFF; // Prevent overflow beyond 0xFFFF
    return opcode;
}

// Execute instructions based on the opcode
function execute(opcode) {
    switch (opcode) {
        case 0x00: // NOP
            break;
        case 0x01: // LXI B, D16
            registers.C = memory[registers.PC];
            registers.B = memory[registers.PC + 1];
            registers.PC += 2;
            break;
        case 0x06: // MVI B, D8
            registers.B = memory[registers.PC];
            registers.PC += 1;
            break;
        case 0x80: // ADD B
            let result = registers.A + registers.B;
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            break;
        case 0xC3: // JMP Address
            registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
            break;
        case 0xC9: // RET
            registers.PC = memory[registers.SP] | (memory[registers.SP + 1] << 8);
            registers.SP += 2;
            break;
        default:
            console.log('Unsupported Opcode:', opcode.toString(16));
            break;
    }
    return true;
}


// Initialize the simulator
function init() {
    registers.PC = 0x0000;
    registers.A = registers.B = registers.C = registers.D = registers.E = registers.H = registers.L = 0x00;
    memory.fill(0x00);
    saveMemory();
    updateDisplay();
    displayMemory(); // Call this to initially populate the memory table
    console.log("Simulator Initialized.");
}

// Save memory to local storage
function saveMemory() {
    localStorage.setItem('memory', JSON.stringify(memory));
}

function updateDisplay() {
    // Update address and code display
    document.getElementById('address_display').innerText = registers.PC.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('code_display').innerText = memory[registers.PC].toString(16).toUpperCase().padStart(2, '0');

    // Update register values
    document.getElementById('register-A').innerText = registers.A.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-B').innerText = registers.B.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-C').innerText = registers.C.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-D').innerText = registers.D.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-E').innerText = registers.E.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-H').innerText = registers.H.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-L').innerText = registers.L.toString(16).toUpperCase().padStart(2, '0');
    document.getElementById('register-SP').innerText = registers.SP.toString(16).toUpperCase().padStart(4, '0');
    document.getElementById('register-PC').innerText = registers.PC.toString(16).toUpperCase().padStart(4, '0');

    // Update flags
    document.getElementById('flag-Z').innerText = flags.Z;
    document.getElementById('flag-S').innerText = flags.S;
    document.getElementById('flag-P').innerText = flags.P;
    document.getElementById('flag-CY').innerText = flags.CY;
    document.getElementById('flag-AC').innerText = flags.AC;
}


// Run the simulator
function run() {
    let running = true;
    while (running) {
        const opcode = fetch();
        running = execute(opcode);
        updateDisplay();
    }
}

// Toggle memory view
document.getElementById('memory_button').addEventListener('click', () => {
    const memoryDisplay = document.getElementById('memory_display');
    memoryDisplay.classList.toggle('hidden');
    if (!memoryDisplay.classList.contains('hidden')) {
        displayMemory();
    }
});

// Display memory content in table format
function displayMemory() {
    const memoryTable = document.getElementById('memory_table');
    memoryTable.innerHTML = ''; // Clear existing content

    // Create table headers
    let headerRow = document.createElement('tr');
    let addressHeader = document.createElement('th');
    addressHeader.innerText = 'Address';
    headerRow.appendChild(addressHeader);

    for (let i = 0; i < 0xFFFF; i += 16) {
        let header = document.createElement('th');
        header.innerText = i.toString(16).toUpperCase().padStart(4, '0');
        headerRow.appendChild(header);
    }

    memoryTable.appendChild(headerRow);

    // Create table rows for memory content
    for (let j = 0; j < 16; j++) {
        let row = document.createElement('tr');
        let labelCell = document.createElement('td');
        labelCell.innerText = j.toString(16).toUpperCase(); // Column index as a label
        row.appendChild(labelCell);

        for (let i = 0; i < 0xFFFF; i += 16) {
            let cell = document.createElement('td');
            let value = memory[i + j] ? memory[i + j].toString(16).toUpperCase().padStart(2, '0') : '00';
            cell.innerText = value;
            row.appendChild(cell);
        }

        memoryTable.appendChild(row);
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const table = document.getElementById("memory_table");

    // Fix the first column
    function fixFirstColumn() {
        // Remove previous fixed column classes
        table.querySelectorAll('thead th, tbody td').forEach(cell => cell.classList.remove('fixed-column'));

        // Apply fixed column class to header and cells in the first column
        const headers = table.querySelectorAll('thead th:first-child');
        const cells = table.querySelectorAll('tbody td:first-child');

        headers.forEach(header => header.classList.add('fixed-column'));
        cells.forEach(cell => cell.classList.add('fixed-column'));
    }

    // Call function to fix the first column
    fixFirstColumn();
});


// Address/Code selection handling
let selectedDisplay = 'address'; // Default to address

document.getElementById('star_button').addEventListener('click', () => {
    if (selectedDisplay === 'address') {
        selectedDisplay = 'code';
        document.getElementById('address_display').classList.remove('active');
        document.getElementById('code_display').classList.add('active');
    } else {
        selectedDisplay = 'address';
        document.getElementById('address_display').classList.add('active');
        document.getElementById('code_display').classList.remove('active');
    }
});

// Hex button input handling
document.querySelectorAll('.hex_button').forEach(button => {
    button.addEventListener('click', () => {
        const value = button.title.replace('Hex ', '');
        if (selectedDisplay === 'address') {
            const newAddress = parseInt(document.getElementById('address_display').innerText + value, 16) & 0xFFFF;
            document.getElementById('address_display').innerText = newAddress.toString(16).toUpperCase().padStart(4, '0');
            registers.PC = newAddress;
        } else if (selectedDisplay === 'code') {
            const newCode = (document.getElementById('code_display').innerText + value).slice(-2);
            document.getElementById('code_display').innerText = newCode;
            memory[registers.PC] = parseInt(newCode, 16);
            saveMemory();
        }
    });
});

// Increment address
document.querySelector('#inc_button').addEventListener('click', () => {
    registers.PC = (registers.PC + 1) & 0xFFFF; // Keep within 16-bit address space
    updateDisplay();
});

document.querySelector('#dec_button').addEventListener('click', () => {
    registers.PC = (registers.PC - 1) & 0xFFFF; // Keep within 16-bit address space
    updateDisplay();
});

// keep tracking buttons
document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', (event) => {
        updateDisplay();
        const clickedButton = event.target;
        console.log(`Button clicked: ID=${clickedButton.id}, Title=${clickedButton.title}`);
    });
});

// Reset the simulator
document.getElementById('reset_button').addEventListener('click', () => {
    init();
});

// Initialize the simulator on page load
init();
