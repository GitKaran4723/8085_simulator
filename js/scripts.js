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

let halted = false; // Add a halted flag to stop execution properly

// Function to fetch the next instruction
function fetch() {
    const opcode = memory[registers.PC];
    registers.PC = (registers.PC + 1) & 0xFFFF; // Prevent overflow beyond 0xFFFF
    return opcode;
}

// Execute instructions based on the opcode
function execute(opcode) {
    switch (opcode) {
        // Data Transfer Instructions
        case 0x00: // NOP (No Operation)
            // Do nothing, just move to the next instruction
            break;
            
        case 0x01: // LXI B, D16 (Load immediate 16-bit data into BC)
            registers.C = memory[registers.PC];
            registers.B = memory[registers.PC + 1];
            registers.PC += 2;
            break;
            
        case 0x11: // LXI D, D16 (Load immediate 16-bit data into DE)
            registers.E = memory[registers.PC];
            registers.D = memory[registers.PC + 1];
            registers.PC += 2;
            break;
            
        case 0x21: // LXI H, D16 (Load immediate 16-bit data into HL)
            registers.L = memory[registers.PC];
            registers.H = memory[registers.PC + 1];
            registers.PC += 2;
            break;
            
        case 0x31: // LXI SP, D16 (Load immediate 16-bit data into SP)
            registers.SP = memory[registers.PC] | (memory[registers.PC + 1] << 8);
            registers.PC += 2;
            break;
            
        case 0x06: // MVI B, D8 (Move immediate data to register B)
            registers.B = memory[registers.PC];
            registers.PC += 1;
            break;
            
        case 0x0E: // MVI C, D8 (Move immediate data to register C)
            registers.C = memory[registers.PC];
            registers.PC += 1;
            break;
            
        case 0x16: // MVI D, D8 (Move immediate data to register D)
            registers.D = memory[registers.PC];
            registers.PC += 1;
            break;
            
        case 0x1E: // MVI E, D8 (Move immediate data to register E)
            registers.E = memory[registers.PC];
            registers.PC += 1;
            break;
            
        case 0x26: // MVI H, D8 (Move immediate data to register H)
            registers.H = memory[registers.PC];
            registers.PC += 1;
            break;
            
        case 0x2E: // MVI L, D8 (Move immediate data to register L)
            registers.L = memory[registers.PC];
            registers.PC += 1;
            break;

        case 0x3E: // MVI A, D8 (Move immediate data to the accumulator A)
            registers.A = memory[registers.PC]; // Load immediate value from the next memory location into register A
            registers.PC += 1; // Increment PC to move past the immediate data byte
            break;
    
        case 0x7E: // MOV A, M (Move data from memory to register A)
            registers.A = memory[registers.H << 8 | registers.L];
            break;
    
        // Arithmetic Instructions
        case 0x80: // ADD B (Add register B to register A)
            let result = registers.A + registers.B;
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.CY = (result > 0xFF) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0x81: // ADD C
            result = registers.A + registers.C;
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.CY = (result > 0xFF) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0x86: // ADD M (Add memory to register A)
            let address = (registers.H << 8) | registers.L;
            result = registers.A + memory[address];
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.CY = (result > 0xFF) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0x90: // SUB B
            result = registers.A - registers.B;
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.CY = (result < 0) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0x91: // SUB C
            result = registers.A - registers.C;
            registers.A = result & 0xFF;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.CY = (result < 0) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        // Logical Instructions
        case 0xA0: // ANA B (Logical AND register B with A)
            registers.A = registers.A & registers.B;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0xA7: // ANA A (Logical AND register A with A)
            registers.A = registers.A & registers.A;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        case 0xB0: // ORA B (Logical OR register B with A)
            registers.A = registers.A | registers.B;
            flags.Z = (registers.A === 0) ? 1 : 0;
            flags.S = (registers.A & 0x80) ? 1 : 0;
            flags.P = (registers.A.toString(2).split('1').length - 1) % 2 === 0 ? 1 : 0;
            break;
    
        // Branch Instructions
        case 0xC3: // JMP address (Unconditional jump)
            registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
            break;
    
        case 0xCA: // JZ address (Jump if zero flag is set)
            if (flags.Z === 1) {
                registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
            } else {
                registers.PC += 2; // Skip address
            }
            break;
    
        case 0xD2: // JNC address (Jump if no carry)
            if (flags.CY === 0) {
                registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
            } else {
                registers.PC += 2; // Skip address
            }
            break;
    
        // Stack and Subroutine Instructions
        case 0xC5: // PUSH B (Push register pair BC onto the stack)
            memory[--registers.SP] = registers.B;
            memory[--registers.SP] = registers.C;
            break;
    
        case 0xD5: // PUSH D (Push register pair DE onto the stack)
            memory[--registers.SP] = registers.D;
            memory[--registers.SP] = registers.E;
            break;
    
        case 0xE5: // PUSH H (Push register pair HL onto the stack)
            memory[--registers.SP] = registers.H;
            memory[--registers.SP] = registers.L;
            break;
    
        case 0xF1: // POP PSW (Pop Processor Status Word)
            registers.A = memory[registers.SP++];
            const psw = memory[registers.SP++];
            flags.Z = (psw & 0x40) ? 1 : 0;
            flags.S = (psw & 0x80) ? 1 : 0;
            flags.P = (psw & 0x04) ? 1 : 0;
            flags.CY = (psw & 0x01) ? 1 : 0;
            flags.AC = (psw & 0x10) ? 1 : 0;
            break;
    
        case 0xC9: // RET (Return from subroutine)
            registers.PC = memory[registers.SP] | (memory[registers.SP + 1] << 8);
            registers.SP += 2;
            break;
    
        case 0x76: // HLT (Halt execution)
            halted = true;
            return false; // Stop execution loop
    
        default:
            console.log('Unsupported Opcode:', opcode.toString(16));
            break;
    }
    
    return true; // Continue execution unless HLT
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

// Update the display with register and memory information
function updateDisplay(executing = null) {
    if (executing) {
        // Show "Executing" on the code display when the program is running
        document.getElementById('code_display').innerText = "EXEC";
    } else {
        // Update address and code display normally when not executing
        document.getElementById('address_display').innerText = registers.PC.toString(16).toUpperCase().padStart(4, '0');
        document.getElementById('code_display').innerText = memory[registers.PC].toString(16).toUpperCase().padStart(2, '0');
    }

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
    if (!halted) {
        const opcode = fetch(); // Fetch the next instruction
        const running = execute(opcode); // Execute the instruction
        updateDisplay("Executing"); // Show "Executing" in the display during execution

        if (running) {
            // Use a delay between instruction executions to simulate real-time running
            setTimeout(run, 500); // Adjust the delay as needed
        } else {
            updateDisplay(); // Revert back to showing the normal code when done
            halted = true;
            console.log("Execution halted.");
        }
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

// EXEC button functionality
document.getElementById('execute_button').addEventListener('click', () => {
    halted = false; // Reset halt state before execution
    run(); // Start the program
});

// Initialize the simulator on page load
init();
