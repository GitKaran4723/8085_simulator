// Define 8085 Registers
const registers = {
  A: 0x00,
  B: 0x00,
  C: 0x00,
  D: 0x00,
  E: 0x00,
  H: 0x00,
  L: 0x00,
  SP: 0xffff, // Stack Pointer
  PC: 0x0000, // Program Counter
};

// Define Flags
const flags = {
  Z: 0, // Zero flag
  S: 0, // Sign flag
  P: 0, // Parity flag
  CY: 0, // Carry flag
  AC: 0, // Auxiliary Carry flag
};

// Memory
const memory = new Array(65536).fill(0x00);

// Load memory from local storage if available
if (localStorage.getItem("memory")) {
  const storedMemory = JSON.parse(localStorage.getItem("memory"));
  for (let i = 0; i < storedMemory.length; i++) {
    memory[i] = storedMemory[i];
  }
}

let halted = false; // Add a halted flag to stop execution properly

// Function to fetch_code the next instruction
function fetch_code() {
  const opcode = memory[registers.PC];
  registers.PC = (registers.PC + 1) & 0xffff; // Prevent overflow beyond 0xFFFF
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

    case 0x4f: // MOV C, A (Move the content of A into C)
      registers.C = registers.A; // Copy the value from accumulator A to register C
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

    case 0x0e: // MVI C, D8 (Move immediate data to register C)
      registers.C = memory[registers.PC];
      registers.PC += 1;
      break;

    case 0x16: // MVI D, D8 (Move immediate data to register D)
      registers.D = memory[registers.PC];
      registers.PC += 1;
      break;

    case 0x1e: // MVI E, D8 (Move immediate data to register E)
      registers.E = memory[registers.PC];
      registers.PC += 1;
      break;

    case 0x26: // MVI H, D8 (Move immediate data to register H)
      registers.H = memory[registers.PC];
      registers.PC += 1;
      break;

    case 0x2e: // MVI L, D8 (Move immediate data to register L)
      registers.L = memory[registers.PC];
      registers.PC += 1;
      break;

    case 0x2c: // INR L (Increment the value of register L)
      let result_L = (registers.L + 1) & 0xff; // Increment the L register and handle 8-bit overflow
      flags.Z = result_L === 0 ? 1 : 0; // Set Zero flag if the result_L is zero
      flags.S = result_L & 0x80 ? 1 : 0; // Set Sign flag if the result_L is negative (if bit 7 is set)
      flags.P = (result_L.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0; // Set Parity flag if result_L has even parity
      flags.AC = (registers.L & 0x0f) + 1 > 0x0f ? 1 : 0; // Set Auxiliary Carry flag for lower nibble carry
      registers.L = result_L; // Store the result_L back in register L
      break;

    case 0x3e: // MVI A, D8 (Move immediate data to the accumulator A)
      registers.A = memory[registers.PC]; // Load immediate value from the next memory location into register A
      registers.PC += 1; // Increment PC to move past the immediate data byte
      break;

    case 0x3a: // LDA addr (Load memory value into accumulator A)
      const lowByte = memory[registers.PC]; // Get the low byte of the address
      const highByte = memory[registers.PC + 1]; // Get the high byte of the address
      const address = (highByte << 8) | lowByte; // Combine to form the full 16-bit address
      registers.A = memory[address]; // Load the memory content at that address into the accumulator
      registers.PC += 2; // Increment PC by 2 since we fetched a 16-bit address
      break;

    case 0x47: // MOV B, A (Move the content of A into B)
      registers.B = registers.A; // Copy the value from accumulator A to register B
      break;

    case 0x32: // STA addr (Store accumulator A into memory)
      const lowByteSTA = memory[registers.PC]; // Get the low byte of the address
      const highByteSTA = memory[registers.PC + 1]; // Get the high byte of the address
      const addressSTA = (highByteSTA << 8) | lowByteSTA; // Combine to form the full 16-bit address
      memory[addressSTA] = registers.A; // Store the content of A into the memory address
      registers.PC += 2; // Increment PC by 2 to skip over the 16-bit address
      saveMemory(); // Save memory to local storage after the operation
      break;

    case 0x7e: // MOV A, M (Move data from memory to register A)
      registers.A = memory[(registers.H << 8) | registers.L];
      break;

    case 0x78: // MOV A, B (Move the content of B into A)
      registers.A = registers.B; // Copy the value from register B to accumulator A
      break;

    // Arithmetic Instructions
    case 0x80: // ADD B (Add register B to register A)
      let result = registers.A + registers.B;
      registers.A = result & 0xff;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.CY = result > 0xff ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0x81: // ADD C
      result = registers.A + registers.C;
      registers.A = result & 0xff;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.CY = result > 0xff ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0x86: // ADD M (Add memory to register A)
      let addressM = (registers.H << 8) | registers.L;
      result = registers.A + memory[addressM];
      registers.A = result & 0xff;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.CY = result > 0xff ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0x90: // SUB B
      result = registers.A - registers.B;
      registers.A = result & 0xff;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.CY = result < 0 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0x91: // SUB C
      result = registers.A - registers.C;
      registers.A = result & 0xff;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.CY = result < 0 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    // Logical Instructions
    case 0xa0: // ANA B (Logical AND register B with A)
      registers.A = registers.A & registers.B;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xa7: // ANA A (Logical AND register A with A)
      registers.A = registers.A & registers.A;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xb0: // ORA B (Logical OR register B with A)
      registers.A = registers.A | registers.B;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    // Branch Instructions
    case 0xc3: // JMP address (Unconditional jump)
      registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
      break;

    case 0xca: // JZ address (Jump if zero flag is set)
      if (flags.Z === 1) {
        registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
      } else {
        registers.PC += 2; // Skip address
      }
      break;

    case 0xd2: // JNC address (Jump if no carry)
      if (flags.CY === 0) {
        registers.PC = memory[registers.PC] | (memory[registers.PC + 1] << 8);
      } else {
        registers.PC += 2; // Skip address
      }
      break;

    // Stack and Subroutine Instructions
    case 0xc5: // PUSH B (Push register pair BC onto the stack)
      memory[--registers.SP] = registers.B;
      memory[--registers.SP] = registers.C;
      break;

    case 0xd5: // PUSH D (Push register pair DE onto the stack)
      memory[--registers.SP] = registers.D;
      memory[--registers.SP] = registers.E;
      break;

    case 0xe5: // PUSH H (Push register pair HL onto the stack)
      memory[--registers.SP] = registers.H;
      memory[--registers.SP] = registers.L;
      break;

    case 0xf1: // POP PSW (Pop Processor Status Word)
      registers.A = memory[registers.SP++];
      const psw = memory[registers.SP++];
      flags.Z = psw & 0x40 ? 1 : 0;
      flags.S = psw & 0x80 ? 1 : 0;
      flags.P = psw & 0x04 ? 1 : 0;
      flags.CY = psw & 0x01 ? 1 : 0;
      flags.AC = psw & 0x10 ? 1 : 0;
      break;

    case 0xc9: // RET (Return from subroutine)
      registers.PC = memory[registers.SP] | (memory[registers.SP + 1] << 8);
      registers.SP += 2;
      break;

    case 0x76: // HLT (Halt execution)
      halted = true;
      return false; // Stop execution loop

    case 0x79: // MOV A, C (Move the content of C into A)
      registers.A = registers.C; // Copy the value from register C to accumulator A
      break;

    case 0x40: // MOV B, B
      // No operation since B is copied to itself.
      break;

    case 0x41: // MOV B, C
      registers.B = registers.C;
      break;

    case 0x42: // MOV B, D
      registers.B = registers.D;
      break;

    case 0x43: // MOV B, E
      registers.B = registers.E;
      break;

    case 0x44: // MOV B, H
      registers.B = registers.H;
      break;

    case 0x45: // MOV B, L
      registers.B = registers.L;
      break;

    case 0x46: // MOV B, M
      registers.B = memory[(registers.H << 8) | registers.L]; // B = memory[HL]
      break;

    case 0x48: // MOV C, B
      registers.C = registers.B;
      break;

    case 0x49: // MOV C, C
      // No operation since C is copied to itself.
      break;

    case 0x4a: // MOV C, D
      registers.C = registers.D;
      break;

    case 0x4b: // MOV C, E
      registers.C = registers.E;
      break;

    case 0x4c: // MOV C, H
      registers.C = registers.H;
      break;

    case 0x4d: // MOV C, L
      registers.C = registers.L;
      break;

    case 0x4e: // MOV C, M
      registers.C = memory[(registers.H << 8) | registers.L]; // C = memory[HL]
      break;

    case 0x50: // MOV D, B
      registers.D = registers.B;
      break;

    case 0x51: // MOV D, C
      registers.D = registers.C;
      break;

    case 0x52: // MOV D, D
      // No operation since D is copied to itself.
      break;

    case 0x53: // MOV D, E
      registers.D = registers.E;
      break;

    case 0x54: // MOV D, H
      registers.D = registers.H;
      break;

    case 0x55: // MOV D, L
      registers.D = registers.L;
      break;

    case 0x56: // MOV D, M
      registers.D = memory[(registers.H << 8) | registers.L]; // D = memory[HL]
      break;

    case 0x57: // MOV D, A (Move the content of A into D)
      registers.D = registers.A; // Copy the value from accumulator A to register D
      break;

    case 0x58: // MOV E, B
      registers.E = registers.B;
      break;

    case 0x59: // MOV E, C
      registers.E = registers.C;
      break;

    case 0x5a: // MOV E, D
      registers.E = registers.D;
      break;

    case 0x5b: // MOV E, E
      // No operation since E is copied to itself.
      break;

    case 0x5c: // MOV E, H
      registers.E = registers.H;
      break;

    case 0x5d: // MOV E, L
      registers.E = registers.L;
      break;

    case 0x5e: // MOV E, M
      registers.E = memory[(registers.H << 8) | registers.L]; // E = memory[HL]
      break;

    case 0x60: // MOV H, B
      registers.H = registers.B;
      break;

    case 0x61: // MOV H, C
      registers.H = registers.C;
      break;

    case 0x62: // MOV H, D
      registers.H = registers.D;
      break;

    case 0x63: // MOV H, E
      registers.H = registers.E;
      break;

    case 0x64: // MOV H, H
      // No operation since H is copied to itself.
      break;

    case 0x65: // MOV H, L
      registers.H = registers.L;
      break;

    case 0x66: // MOV H, M
      registers.H = memory[(registers.H << 8) | registers.L]; // H = memory[HL]
      break;

    case 0x68: // MOV L, B
      registers.L = registers.B;
      break;

    case 0x69: // MOV L, C
      registers.L = registers.C;
      break;

    case 0x6a: // MOV L, D
      registers.L = registers.D;
      break;

    case 0x6b: // MOV L, E
      registers.L = registers.E;
      break;

    case 0x6c: // MOV L, H
      registers.L = registers.H;
      break;

    case 0x6d: // MOV L, L
      // No operation since L is copied to itself.
      break;

    case 0x6e: // MOV L, M
      registers.L = memory[(registers.H << 8) | registers.L]; // L = memory[HL]
      break;

    case 0x70: // MOV M, B
      memory[(registers.H << 8) | registers.L] = registers.B; // memory[HL] = B
      break;

    case 0x71: // MOV M, C
      memory[(registers.H << 8) | registers.L] = registers.C; // memory[HL] = C
      break;

    case 0x72: // MOV M, D
      memory[(registers.H << 8) | registers.L] = registers.D; // memory[HL] = D
      break;

    case 0x73: // MOV M, E
      memory[(registers.H << 8) | registers.L] = registers.E; // memory[HL] = E
      break;

    case 0x74: // MOV M, H
      memory[(registers.H << 8) | registers.L] = registers.H; // memory[HL] = H
      break;

    case 0x75: // MOV M, L
      memory[(registers.H << 8) | registers.L] = registers.L; // memory[HL] = L
      break;

    case 0x0a: // LDAX B (Load accumulator A from memory address in BC)
      registers.A = memory[(registers.B << 8) | registers.C]; // A = memory[BC]
      break;

    case 0x04: // INR B (Increment register B)
      registers.B = (registers.B + 1) & 0xff;
      flags.Z = registers.B === 0 ? 1 : 0;
      flags.S = registers.B & 0x80 ? 1 : 0;
      flags.P =
        (registers.B.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.B & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x0c: // INR C (Increment register C)
      registers.C = (registers.C + 1) & 0xff;
      flags.Z = registers.C === 0 ? 1 : 0;
      flags.S = registers.C & 0x80 ? 1 : 0;
      flags.P =
        (registers.C.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.C & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x14: // INR D (Increment register D)
      registers.D = (registers.D + 1) & 0xff;
      flags.Z = registers.D === 0 ? 1 : 0;
      flags.S = registers.D & 0x80 ? 1 : 0;
      flags.P =
        (registers.D.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.D & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x1c: // INR E (Increment register E)
      registers.E = (registers.E + 1) & 0xff;
      flags.Z = registers.E === 0 ? 1 : 0;
      flags.S = registers.E & 0x80 ? 1 : 0;
      flags.P =
        (registers.E.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.E & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x24: // INR H (Increment register H)
      registers.H = (registers.H + 1) & 0xff;
      flags.Z = registers.H === 0 ? 1 : 0;
      flags.S = registers.H & 0x80 ? 1 : 0;
      flags.P =
        (registers.H.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.H & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x34: // INR M (Increment value in memory at address HL)
      let memAddr = (registers.H << 8) | registers.L;
      memory[memAddr] = (memory[memAddr] + 1) & 0xff;
      flags.Z = memory[memAddr] === 0 ? 1 : 0;
      flags.S = memory[memAddr] & 0x80 ? 1 : 0;
      flags.P =
        (memory[memAddr].toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (memory[memAddr] & 0x0f) + 1 > 0x0f ? 1 : 0;
      break;

    case 0x0d: // DCR C (Decrement register C)
      registers.C = (registers.C - 1) & 0xff;
      flags.Z = registers.C === 0 ? 1 : 0;
      flags.S = registers.C & 0x80 ? 1 : 0;
      flags.P =
        (registers.C.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.C & 0x0f) === 0x0f ? 1 : 0;
      break;

    case 0x1d: // DCR E (Decrement register E)
      registers.E = (registers.E - 1) & 0xff;
      flags.Z = registers.E === 0 ? 1 : 0;
      flags.S = registers.E & 0x80 ? 1 : 0;
      flags.P =
        (registers.E.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.E & 0x0f) === 0x0f ? 1 : 0;
      break;

    case 0x25: // DCR H (Decrement register H)
      registers.H = (registers.H - 1) & 0xff;
      flags.Z = registers.H === 0 ? 1 : 0;
      flags.S = registers.H & 0x80 ? 1 : 0;
      flags.P =
        (registers.H.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      flags.AC = (registers.H & 0x0f) === 0x0f ? 1 : 0;
      break;

    case 0x35: // DCR M (Decrement value in memory at address HL)
      let memAddrDcr = (registers.H << 8) | registers.L;
      memory[memAddrDcr] = (memory[memAddrDcr] - 1) & 0xff;
      flags.Z = memory[memAddrDcr] === 0 ? 1 : 0;
      flags.S = memory[memAddrDcr] & 0x80 ? 1 : 0;
      flags.P =
        (memory[memAddrDcr].toString(2).split("1").length - 1) % 2 === 0
          ? 1
          : 0;
      flags.AC = (memory[memAddrDcr] & 0x0f) === 0x0f ? 1 : 0;
      break;

    case 0xa8: // XRA B (Exclusive OR B with A)
      registers.A = registers.A ^ registers.B;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xa9: // XRA C (Exclusive OR C with A)
      registers.A = registers.A ^ registers.C;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xaa: // XRA D (Exclusive OR D with A)
      registers.A = registers.A ^ registers.D;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xab: // XRA E (Exclusive OR E with A)
      registers.A = registers.A ^ registers.E;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xaf: // XRA A (Exclusive OR A with A)
      registers.A = registers.A ^ registers.A;
      flags.Z = registers.A === 0 ? 1 : 0;
      flags.S = registers.A & 0x80 ? 1 : 0;
      flags.P =
        (registers.A.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xb8: // CMP B (Compare B with A)
      let cmpResult = registers.A - registers.B;
      flags.Z = cmpResult === 0 ? 1 : 0;
      flags.S = cmpResult & 0x80 ? 1 : 0;
      flags.CY = cmpResult < 0 ? 1 : 0;
      flags.P = (cmpResult.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0xb9: // CMP C (Compare C with A)
      cmpResult = registers.A - registers.C;
      flags.Z = cmpResult === 0 ? 1 : 0;
      flags.S = cmpResult & 0x80 ? 1 : 0;
      flags.CY = cmpResult < 0 ? 1 : 0;
      flags.P = (cmpResult.toString(2).split("1").length - 1) % 2 === 0 ? 1 : 0;
      break;

    case 0x1a: // LDAX D (Load accumulator A from memory address in DE)
      registers.A = memory[(registers.D << 8) | registers.E]; // A = memory[DE]
      break;

    case 0x02: // STAX B (Store accumulator A into memory address in BC)
      memory[(registers.B << 8) | registers.C] = registers.A; // memory[BC] = A
      break;

    case 0x12: // STAX D (Store accumulator A into memory address in DE)
      memory[(registers.D << 8) | registers.E] = registers.A; // memory[DE] = A
      break;

    default:
      console.log("Unsupported Opcode:", opcode.toString(16));
      break;
  }

  return true; // Continue execution unless HLT
}

// Initialize the simulator
function init() {
  registers.PC = 0x0000;
  registers.A =
    registers.B =
    registers.C =
    registers.D =
    registers.E =
    registers.H =
    registers.L =
      0x00;
  //memory.fill(0x00);
  //saveMemory();
  updateDisplay();
  displayMemory(); // Call this to initially populate the memory table
  console.log("Simulator Initialized.");
}

const refresh_memory_button = document.getElementById("refresh_memory_button");
refresh_memory_button.addEventListener("click", () => {
  memory.fill(0x00);
  saveMemory();
  updateDisplay();
  displayMemory();
  console.log("Memory Reset.");
});

// Save memory to local storage
function saveMemory() {
  localStorage.setItem("memory", JSON.stringify(memory));
}

// Update the display with register and memory information
function updateDisplay(executing = null) {
  if (executing) {
    // Show "Executing" on the code display when the program is running
    document.getElementById("code_display").innerText = "EXEC";
  } else {
    // Update address and code display normally when not executing
    document.getElementById("address_display").innerText =
      registers.PC.toString(16).toUpperCase().padStart(4, "0");
    document.getElementById("code_display").innerText = memory[registers.PC]
      .toString(16)
      .toUpperCase()
      .padStart(2, "0");
  }

  // Update register values
  document.getElementById("register-A").innerText = registers.A.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-B").innerText = registers.B.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-C").innerText = registers.C.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-D").innerText = registers.D.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-E").innerText = registers.E.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-H").innerText = registers.H.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-L").innerText = registers.L.toString(16)
    .toUpperCase()
    .padStart(2, "0");
  document.getElementById("register-SP").innerText = registers.SP.toString(16)
    .toUpperCase()
    .padStart(4, "0");
  document.getElementById("register-PC").innerText = registers.PC.toString(16)
    .toUpperCase()
    .padStart(4, "0");

  // Update flags
  document.getElementById("flag-Z").innerText = flags.Z;
  document.getElementById("flag-S").innerText = flags.S;
  document.getElementById("flag-P").innerText = flags.P;
  document.getElementById("flag-CY").innerText = flags.CY;
  document.getElementById("flag-AC").innerText = flags.AC;
}

// Run the simulator
function run() {
  if (!halted) {
    const opcode = fetch_code(); // Fetch the next instruction
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
document.getElementById("memory_button").addEventListener("click", () => {
  const memoryDisplay = document.getElementById("memory_display");
  memoryDisplay.classList.toggle("hidden");
  if (!memoryDisplay.classList.contains("hidden")) {
    displayMemory();
  }
});

// Display memory content in table format
function displayMemory() {
  const memoryTable = document.getElementById("memory_table");
  memoryTable.innerHTML = ""; // Clear existing content

  // Create table headers
  let headerRow = document.createElement("tr");
  let addressHeader = document.createElement("th");
  addressHeader.innerText = "Address";
  headerRow.appendChild(addressHeader);

  for (let i = 0; i < 0xffff; i += 16) {
    let header = document.createElement("th");
    header.innerText = i.toString(16).toUpperCase().padStart(4, "0");
    headerRow.appendChild(header);
  }

  memoryTable.appendChild(headerRow);

  // Create table rows for memory content
  for (let j = 0; j < 16; j++) {
    let row = document.createElement("tr");
    let labelCell = document.createElement("td");
    labelCell.innerText = j.toString(16).toUpperCase(); // Column index as a label
    row.appendChild(labelCell);

    for (let i = 0; i < 0xffff; i += 16) {
      let cell = document.createElement("td");
      let value = memory[i + j]
        ? memory[i + j].toString(16).toUpperCase().padStart(2, "0")
        : "00";
      cell.innerText = value;
      row.appendChild(cell);
    }

    memoryTable.appendChild(row);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const table = document.getElementById("memory_table");

  // Fix the first column
  function fixFirstColumn() {
    // Remove previous fixed column classes
    table
      .querySelectorAll("thead th, tbody td")
      .forEach((cell) => cell.classList.remove("fixed-column"));

    // Apply fixed column class to header and cells in the first column
    const headers = table.querySelectorAll("thead th:first-child");
    const cells = table.querySelectorAll("tbody td:first-child");

    headers.forEach((header) => header.classList.add("fixed-column"));
    cells.forEach((cell) => cell.classList.add("fixed-column"));
  }

  // Call function to fix the first column
  fixFirstColumn();
});

// Address/Code selection handling
let selectedDisplay = "address"; // Default to address

document.getElementById("star_button").addEventListener("click", () => {
  if (selectedDisplay === "address") {
    selectedDisplay = "code";
    document.getElementById("address_display").classList.remove("active");
    document.getElementById("code_display").classList.add("active");
  } else {
    selectedDisplay = "address";
    document.getElementById("address_display").classList.add("active");
    document.getElementById("code_display").classList.remove("active");
  }
});

// Hex button input handling
document.querySelectorAll(".hex_button").forEach((button) => {
  button.addEventListener("click", () => {
    const value = button.title.replace("Hex ", "");
    if (selectedDisplay === "address") {
      const newAddress =
        parseInt(
          document.getElementById("address_display").innerText + value,
          16
        ) & 0xffff;
      document.getElementById("address_display").innerText = newAddress
        .toString(16)
        .toUpperCase()
        .padStart(4, "0");
      registers.PC = newAddress;
    } else if (selectedDisplay === "code") {
      const newCode = (
        document.getElementById("code_display").innerText + value
      ).slice(-2);
      document.getElementById("code_display").innerText = newCode;
      memory[registers.PC] = parseInt(newCode, 16);
      saveMemory();
    }
  });
});

// Increment address
document.querySelector("#inc_button").addEventListener("click", () => {
  registers.PC = (registers.PC + 1) & 0xffff; // Keep within 16-bit address space
  updateDisplay();
});

document.querySelector("#dec_button").addEventListener("click", () => {
  registers.PC = (registers.PC - 1) & 0xffff; // Keep within 16-bit address space
  updateDisplay();
});

// keep tracking buttons
document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("click", (event) => {
    updateDisplay();
    const clickedButton = event.target;
    console.log(
      `Button clicked: ID=${clickedButton.id}, Title=${clickedButton.title}`
    );
  });
});

// Reset the simulator
document.getElementById("reset_button").addEventListener("click", () => {
  saveMemory(); // Save the memory to local storage after reset
  init();
});

// EXEC button functionality
document.getElementById("execute_button").addEventListener("click", () => {
  halted = false; // Reset halt state before execution
  run(); // Start the program
});

// Initialize the simulator on page load
init();
