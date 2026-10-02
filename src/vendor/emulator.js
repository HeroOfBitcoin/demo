
        class GameBoy {
    constructor() {
        this.display = new Display(this);
        this.timer = new Timer(this);
        this.joypad = new Joypad(this);
        this.cartridge = new Cartridge(this);
        this.sound = new Sound(this);
        this.serial = new Serial(this);

        this.a = 0;
        this.fz = false;
        this.fn = false;
        this.fh = false;
        this.fc = false;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.h = 0;
        this.l = 0;
        this._pc = 0x0100;
        this._sp = 0xfffe;

        this.ime = false;

        this.halt = false;

        this._if = 0;
        this._ie = 0;

        this._svbk = 0;

        this.doubleSpeed = false;
        this.speedTrigger = false;

        this.irReadEnable = 0;
        this.irOn = false;

        this.wram = new Uint8Array(0x8000);
        this.hram = new Uint8Array(0x7f);

        this.cgb = false;
        this.cycles = 0;
    }

    get f() {
        return (this.fz << 7) | (this.fn << 6) | (this.fh << 5) | (this.fc << 4);
    }

    set f(value) {
        this.fz = (value & 0x80) != 0;
        this.fn = (value & 0x40) != 0;
        this.fh = (value & 0x20) != 0;
        this.fc = (value & 0x10) != 0;
    }

    get bc() {
        return (this.b << 8) | this.c;
    }

    get de() {
        return (this.d << 8) | this.e;
    }

    get hl() {
        return (this.h << 8) | this.l;
    }

    get sp() {
        return this._sp;
    }

    get sph() {
        return this._sp >> 8;
    }

    get spl() {
        return this._sp & 0xff;
    }

    get pc() {
        return this._pc;
    }

    get pch() {
        return this._pc >> 8;
    }

    get pcl() {
        return this._pc & 0xff;
    }

    set bc(value) {
        this.b = (value >> 8) & 0xff;
        this.c = value & 0xff;
    }

    set de(value) {
        this.d = (value >> 8) & 0xff;
        this.e = value & 0xff;
    }

    set hl(value) {
        this.h = (value >> 8) & 0xff;
        this.l = value & 0xff;
    }

    set sp(value) {
        this._sp = value & 0xffff;
    }

    set pc(value) {
        this._pc = value & 0xffff;
    }

    get svbk() {
        if (!this.cgb) {
            return 0xff;
        }
        return 0xf8 | this._svbk;
    }

    set svbk(value) {
        if (!this.cgb) {
            return;
        }
        this._svbk = value & 0x7;
    }

    get key1() {
        if (!this.cgb) {
            return 0xff;
        }
        return 0x7e | (this.doubleSpeed << 7) | this.speedTrigger;
    }

    set key1(value) {
        if (!this.cgb) {
            return;
        }
        this.speedTrigger = (value & 0x1) != 0;
    }

    get rp() {
        if (!this.cgb) {
            return 0xff;
        }
        return 0x3c | (this.irReadEnable << 6) | (!(this.irReadEnable && this.irOn) << 1) | this.irOn;
    }

    set rp(value) {
        if (!this.cgb) {
            return;
        }
        this.irReadEnable = (value & 0xc0) >> 6;
        this.irOn = (value & 0x1) != 0;
    }

    get if() {
        return 0xe0 | this._if;
    }

    set if(value) {
        this._if = value & GameBoy.interrupts;
    }

    get ie() {
        return this._ie;
    }

    set ie(value) {
        this._ie = value & GameBoy.interrupts;
    }

    requestInterrupt(interrupt) {
        this._if |= interrupt;
    }

    clearInterrupt(interrupt) {
        this._if &= ~interrupt;
    }

    callInterrupt(address) {
        this.writeAddress(--this.sp, this.pch);
        this.writeAddress(--this.sp, this.pcl);
        this.pc = address;
    }

    readWRAM(address) {
        switch (address >> 12) {
            case 0:
                return this.wram[address];
            case 1:
                return this.wram[((this._svbk == 0 ? 1 : this._svbk) << 12) | (address & 0xfff)];
        }
    }

    writeWRAM(address, value) {
        switch (address >> 12) {
            case 0:
                this.wram[address] = value; break;
            case 1:
                this.wram[((this._svbk == 0 ? 1 : this._svbk) << 12) | (address & 0xfff)] = value; break;
        }
    }

    readAddress(address) {
        switch (address >> 13) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
                return this.cartridge.readROM(address & 0x7fff);
            case 0x4:
                return this.display.readVRAM(address & 0x1fff);
            case 0x5:
                return this.cartridge.readRAM(address & 0x1fff);
            case 0x6:
                return this.readWRAM(address & 0x1fff);
            case 0x7:
                if (address <= 0xfdff) {
                    return this.readWRAM(address & 0x1fff);
                } else if (address <= 0xfe9f) {
                    return this.display.oam[address & 0xff];
                } else if (address <= 0xfeff) {
                    return 0xff;
                } else if (address <= 0xff7f) {
                    if (address >= 0xff10 && address <= 0xff3f) {
                        return this.sound.readAddress(address & 0xff);
                    } else {
                        switch (address & 0xff) {
                            case 0x00: return this.joypad.p1;
                            case 0x01: return this.serial.sb;
                            case 0x02: return this.serial.sc;
                            case 0x04: return this.timer.div;
                            case 0x05: return this.timer.tima;
                            case 0x06: return this.timer.tma;
                            case 0x07: return this.timer.tac;
                            case 0x0f: return this.if;
                            case 0x40: return this.display.lcdc;
                            case 0x41: return this.display.stat;
                            case 0x42: return this.display.scy;
                            case 0x43: return this.display.scx;
                            case 0x44: return this.display.ly;
                            case 0x45: return this.display.lyc;
                            case 0x47: return this.display.bgp;
                            case 0x48: return this.display.obp0;
                            case 0x49: return this.display.obp1;
                            case 0x4a: return this.display.wy;
                            case 0x4b: return this.display.wx;
                            case 0x4d: return this.key1;
                            case 0x4f: return this.display.vbk;
                            case 0x55: return this.display.hdma5;
                            case 0x56: return this.rp;
                            case 0x68: return this.display.bcps;
                            case 0x69: return this.display.bcpd;
                            case 0x6a: return this.display.ocps;
                            case 0x6b: return this.display.ocpd;
                            case 0x70: return this.svbk;
                            default: return 0xff;
                        }
                    }
                } else if (address <= 0xfffe) {
                    return this.hram[address & 0x7f];
                } else {
                    return this.ie;
                }
        }
    }

    writeAddress(address, value) {
        switch (address >> 13) {
            case 0x0:
            case 0x1:
            case 0x2:
            case 0x3:
                this.cartridge.writeROM(address & 0x7fff, value); break;
            case 0x4:
                this.display.writeVRAM(address & 0x1fff, value); break;
            case 0x5:
                this.cartridge.writeRAM(address & 0x1fff, value); break;
            case 0x6:
                this.writeWRAM(address & 0x1fff, value); break;
            case 0x7:
                if (address <= 0xfdff) {
                    this.writeWRAM(address & 0x1fff, value);
                } else if (address <= 0xfe9f) {
                    this.display.oam[address & 0xff] = value;
                } else if (address <= 0xfeff) {

                } else if (address <= 0xff7f) {
                    if (address >= 0xff10 && address <= 0xff3f) {
                        this.sound.writeAddress(address & 0xff, value);
                    } else {
                        switch (address & 0xff) {
                            case 0x00: this.joypad.p1 = value; break;
                            case 0x01: this.serial.sb = value; break;
                            case 0x02: this.serial.sc = value; break;
                            case 0x04: this.timer.div = value; break;
                            case 0x05: this.timer.tima = value; break;
                            case 0x06: this.timer.tma = value; break;
                            case 0x07: this.timer.tac = value; break;
                            case 0x0f: this.if = value; break;
                            case 0x40: this.display.lcdc = value; break;
                            case 0x41: this.display.stat = value; break;
                            case 0x42: this.display.scy = value; break;
                            case 0x43: this.display.scx = value; break;
                            case 0x45: this.display.lyc = value; break;
                            case 0x46: this.display.dma = value; break;
                            case 0x47: this.display.bgp = value; break;
                            case 0x48: this.display.obp0 = value; break;
                            case 0x49: this.display.obp1 = value; break;
                            case 0x4a: this.display.wy = value; break;
                            case 0x4b: this.display.wx = value; break;
                            case 0x4d: this.key1 = value; break;
                            case 0x4f: this.display.vbk = value; break;
                            case 0x51: this.display.hdma1 = value; break;
                            case 0x52: this.display.hdma2 = value; break;
                            case 0x53: this.display.hdma3 = value; break;
                            case 0x54: this.display.hdma4 = value; break;
                            case 0x55: this.display.hdma5 = value; break;
                            case 0x56: this.rp = value; break;
                            case 0x68: this.display.bcps = value; break;
                            case 0x69: this.display.bcpd = value; break;
                            case 0x6a: this.display.ocps = value; break;
                            case 0x6b: this.display.ocpd = value; break;
                            case 0x70: this.svbk = value; break;
                            default: break;
                        }
                    }
                } else if (address <= 0xfffe) {
                    this.hram[address & 0x7f] = value;
                } else {
                    this.ie = value;
                }
                break;
        }
    }

    readRegister(register) {
        switch (register) {
            case 0: return this.b;
            case 1: return this.c;
            case 2: return this.d;
            case 3: return this.e;
            case 4: return this.h;
            case 5: return this.l;
            case 6: return this.readAddress(this.hl);
            case 7: return this.a;
        }
    }

    writeRegister(register, value) {
        switch (register) {
            case 0: this.b = value; break;
            case 1: this.c = value; break;
            case 2: this.d = value; break;
            case 3: this.e = value; break;
            case 4: this.h = value; break;
            case 5: this.l = value; break;
            case 6: this.writeAddress(this.hl, value); break;
            case 7: this.a = value; break;
        }
    }

    readDoubleRegisterIndirect(register) {
        switch (register) {
            case 0: return this.readAddress(this.bc);
            case 1: return this.readAddress(this.de);
            case 2: return this.readAddress(this.hl++);
            case 3: return this.readAddress(this.hl--);
        }
    }

    writeDoubleRegisterIndirect(register, value) {
        switch (register) {
            case 0: this.writeAddress(this.bc, value); break;
            case 1: this.writeAddress(this.de, value); break;
            case 2: this.writeAddress(this.hl++, value); break;
            case 3: this.writeAddress(this.hl--, value); break;
        }
    }

    readDoubleRegister(register) {
        switch (register) {
            case 0: return this.bc;
            case 1: return this.de;
            case 2: return this.hl;
            case 3: return this.sp;
        }
    }

    writeDoubleRegister(register, value) {
        switch (register) {
            case 0: this.bc = value; break;
            case 1: this.de = value; break;
            case 2: this.hl = value; break;
            case 3: this.sp = value; break;
        }
    }

    popDoubleRegister(register) {
        switch (register) {
            case 0: this.c = this.readAddress(this.sp++); this.b = this.readAddress(this.sp++); break;
            case 1: this.e = this.readAddress(this.sp++); this.d = this.readAddress(this.sp++); break;
            case 2: this.l = this.readAddress(this.sp++); this.h = this.readAddress(this.sp++); break;
            case 3: this.f = this.readAddress(this.sp++); this.a = this.readAddress(this.sp++); break;
        }
    }

    pushDoubleRegister(register) {
        switch (register) {
            case 0: this.writeAddress(--this.sp, this.b); this.writeAddress(--this.sp, this.c); break;
            case 1: this.writeAddress(--this.sp, this.d); this.writeAddress(--this.sp, this.e); break;
            case 2: this.writeAddress(--this.sp, this.h); this.writeAddress(--this.sp, this.l); break;
            case 3: this.writeAddress(--this.sp, this.a); this.writeAddress(--this.sp, this.f); break;
        }
    }

    readCondition(condition) {
        switch (condition) {
            case 0: return !this.fz;
            case 1: return this.fz;
            case 2: return !this.fc;
            case 3: return this.fc;
        }
    }

    runHdma() {
        this.writeAddress(0x8000 | this.display.hdmaDst++, this.readAddress(this.display.hdmaSrc++));
        if ((this.display.hdmaDst & 0xf) == 0) {
            this.display.hdmaCounter--;
            if (this.display.hdmaCounter == 0) {
                this.display.hdmaOn = false;
                this.display.hblankHdmaOn = false;
                this.display.hdmaTrigger = false;
            }
            if (this.display.hblankHdmaOn) {
                this.display.hdmaOn = false;
            }
        }
    }

    cycle() {
        let cycles = 0;
        if ((this.ime || this.halt) && (this.ie & this.if) != 0) {
            this.halt = false;
            if (this.ime) {
                this.ime = false;
                if ((this.ie & this.if & GameBoy.vblankInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.vblankInterrupt);
                    this.callInterrupt(0x0040);
                } else if ((this.ie & this.if & GameBoy.statInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.statInterrupt);
                    this.callInterrupt(0x0048);
                } else if ((this.ie & this.if & GameBoy.timerInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.timerInterrupt);
                    this.callInterrupt(0x0050);
                } else if ((this.ie & this.if & GameBoy.serialInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.serialInterrupt);
                    this.callInterrupt(0x0058);
                } else if ((this.ie & this.if & GameBoy.joypadInterrupt) != 0) {
                    this.clearInterrupt(GameBoy.joypadInterrupt);
                    this.callInterrupt(0x0060);
                }
                cycles += 5;
            }
        } else {
            cycles += (this.halt || this.display.hdmaOn) ? 1 : this.decode();
        }

        let hardwareCycles = cycles;
        while (hardwareCycles > 0) {
            this.timer.cycle();
            this.serial.cycle();
            hardwareCycles--;
        }

        this.cycles += cycles / (this.doubleSpeed ? 2 : 1);
        while (this.cycles > 0) {
            if (this.display.hdmaOn) {
                this.runHdma();
            }
            this.display.cycle();
            this.sound.cycle();
            this.cycles--;
        }

        if (this.display.hdmaTrigger) {
            this.display.hdmaTrigger = false;
            this.display.hdmaOn = true;
        }

        return cycles / (this.doubleSpeed ? 2 : 1);
    }

    decode() {
        const instr = this.readAddress(this.pc++);
        let cycles = GameBoy.instrCycles[instr];
        const quad = instr >> 6, op1 = (instr & 0x3f) >> 3, op2 = instr & 0x7;
        if (quad === 0) {
            if (op2 == 6) {
                // LD r, n
                const imm = this.readAddress(this.pc++);
                this.writeRegister(op1, imm);
            } else if (op2 == 2) {
                if ((op1 & 0x1) != 0) {
                    // LD A, (rr)
                    this.a = this.readDoubleRegisterIndirect(op1 >> 1);
                } else {
                    // LD (rr), A
                    this.writeDoubleRegisterIndirect(op1 >> 1, this.a);
                }
            } else if ((op1 & 0x1) == 0 && op2 == 1) {
                // LD dd, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeDoubleRegister(op1 >> 1, (imm2 << 8) | imm1);
            } else if (op1 == 1 && op2 == 0) {
                // LD (nn), SP
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                let address = (imm2 << 8) | imm1;
                this.writeAddress(address++, this.spl);
                this.writeAddress(address++, this.sph);
            } else if (op2 == 4) {
                // INC r
                const tmp = (this.readRegister(op1) + 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0;
                this.fn = false;
                this.fz = tmp == 0;
            } else if (op2 == 5) {
                // DEC r
                const tmp = (this.readRegister(op1) - 1) & 0xff;
                this.writeRegister(op1, tmp);
                this.fh = (tmp & 0xf) == 0xf;
                this.fn = true;
                this.fz = tmp == 0;
            } else if ((op1 & 0x1) != 0 && op2 == 1) {
                // ADD HL, ss
                const ss = this.readDoubleRegister(op1 >> 1);
                this.fc = this.hl + ss > 0xffff;
                this.fh = (this.hl & 0xfff) + (ss & 0xfff) > 0xfff;
                this.fn = false;
                this.hl += ss;
            } else if ((op1 & 0x1) == 0 && op2 == 3) {
                // INC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) + 1);
            } else if ((op1 & 0x1) != 0 && op2 == 3) {
                // DEC ss
                this.writeDoubleRegister(op1 >> 1, this.readDoubleRegister(op1 >> 1) - 1);
            } else if (op1 == 0 && op2 == 7) {
                // RLCA
                const carry = this.a & 0x80;
                this.a = ((this.a << 1) | (carry >> 7)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 1 && op2 == 7) {
                // RRCA
                const carry = this.a & 0x1;
                this.a = ((carry << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 2 && op2 == 7) {
                // RLA
                const carry = this.a & 0x80;
                this.a = ((this.a << 1) | this.fc) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 3 && op2 == 7) {
                // RRA
                const carry = this.a & 0x1;
                this.a = ((this.fc << 7) | (this.a >> 1)) & 0xff;
                this.fc = carry != 0;
                this.fh = false;
                this.fn = false;
                this.fz = false;
            } else if (op1 == 3 && op2 == 0) {
                // JR e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                this.pc += offset;
            } else if ((op1 & 0x4) != 0 && op2 == 0) {
                // JR cc, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                if (this.readCondition(op1 & 0x3)) {
                    this.pc += offset;
                    cycles += 1;
                }
            } else if (op1 == 4 && op2 == 7) {
                // DAA
                let tmp = this.a;
                if (!this.fn) {
                    if (this.fc || tmp > 0x99) {
                        tmp += 0x60;
                        this.fc = true;
                    }
                    if (this.fh || (tmp & 0xf) > 0x9) {
                        tmp += 0x06;
                    }
                } else {
                    if (this.fc) {
                        tmp -= 0x60;
                    }
                    if (this.fh) {
                        tmp -= 0x6;
                    }
                }
                this.fh = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 5 && op2 == 7) {
                // CPL
                this.a ^= 0xff;
                this.fh = true;
                this.fn = true;
            } else if (op1 == 0 && op2 == 0) {
                // NOP
            } else if (op1 == 6 && op2 == 7) {
                // SCF
                this.fc = true;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 7 && op2 == 7) {
                // CCF
                this.fc = !this.fc;
                this.fh = false;
                this.fn = false;
            } else if (op1 == 2 && op2 == 0) {
                // STOP
                this.pc++;
                if (this.speedTrigger) {
                    this.speedTrigger = false;
                    this.doubleSpeed = !this.doubleSpeed;
                }
            }
        } else if (quad === 1) {
            if (op1 != 6 || op2 != 6) {
                // LD r, r'
                this.writeRegister(op1, this.readRegister(op2));
            } else {
                // HALT
                this.halt = true;
            }
        } else if (quad === 2) {
            const r = this.readRegister(op2);
            if (op1 == 0) {
                // ADD A, r
                const tmp = this.a + r;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 1) {
                // ADC A, r
                const carry = this.fc;
                const tmp = this.a + r + carry;
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (r & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 2) {
                // SUB A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 3) {
                // SBC A, r
                const carry = this.fc
                const tmp = this.a - r - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 4) {
                // AND A, r
                const tmp = this.a & r;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 5) {
                // XOR A, r
                const tmp = this.a ^ r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 6) {
                // OR A, r
                const tmp = this.a | r;
                this.a |= r;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 7) {
                // CP A, r
                const tmp = this.a - r;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (r & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            }
        } else if (quad === 3) {
            if (op1 == 6 && op2 == 2) {
                // LD A, (C)
                this.a = this.readAddress(0xff00 | this.c);
            } else if (op1 == 4 && op2 == 2) {
                // LD (C), A
                this.writeAddress(0xff00 | this.c, this.a);
            } else if (op1 == 6 && op2 == 0) {
                // LD A, (n)
                const imm = this.readAddress(this.pc++);
                this.a = this.readAddress(0xff00 | imm);
            } else if (op1 == 4 && op2 == 0) {
                // LD (n), A
                const imm = this.readAddress(this.pc++);
                this.writeAddress(0xff00 | imm, this.a);
            } else if (op1 == 7 && op2 == 2) {
                // LD A, (nn)
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.a = this.readAddress((imm2 << 8) | imm1);
            } else if (op1 == 5 && op2 == 2) {
                // LD (nn), A
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress((imm2 << 8) | imm1, this.a);
            } else if (op1 == 7 && op2 == 1) {
                // LD SP, HL
                this.sp = this.hl;
            } else if ((op1 & 0x1) == 0 && op2 == 5) {
                // PUSH qq
                this.pushDoubleRegister(op1 >> 1);
            } else if ((op1 & 0x1) == 0 && op2 == 1) {
                // POP qq
                this.popDoubleRegister(op1 >> 1);
            } else if (op1 == 7 && op2 == 0) {
                // LDHL SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.hl = tmp;
            } else if (op1 == 5 && op2 == 0) {
                // ADD SP, e
                const offset = this.readAddress(this.pc++) << 24 >> 24;
                const tmp = this.sp + offset;
                this.fc = (this.sp & 0xff) + (offset & 0xff) > 0xff;
                this.fh = (this.sp & 0xf) + (offset & 0xf) > 0xf;
                this.fn = false;
                this.fz = false;
                this.sp = tmp;
            } else if (op1 == 0 && op2 == 6) {
                // ADD A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a + imm
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 1 && op2 == 6) {
                // ADC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a + imm + carry
                this.fc = tmp > 0xff;
                this.fh = (this.a & 0xf) + (imm & 0xf) + carry > 0xf;
                this.fn = false;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 2 && op2 == 6) {
                // SUB A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 3 && op2 == 6) {
                // SBC A, n
                const imm = this.readAddress(this.pc++);
                const carry = this.fc;
                const tmp = this.a - imm - carry;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) - carry < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
                this.a = tmp & 0xff;
            } else if (op1 == 4 && op2 == 6) {
                // AND A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a & imm;
                this.fc = false;
                this.fh = true;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 5 && op2 == 6) {
                // XOR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a ^ imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 6 && op2 == 6) {
                // OR A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a | imm;
                this.fc = false;
                this.fh = false;
                this.fn = false;
                this.fz = tmp == 0;
                this.a = tmp;
            } else if (op1 == 7 && op2 == 6) {
                // CP A, n
                const imm = this.readAddress(this.pc++);
                const tmp = this.a - imm;
                this.fc = tmp < 0;
                this.fh = (this.a & 0xf) - (imm & 0xf) < 0;
                this.fn = true;
                this.fz = (tmp & 0xff) == 0;
            } else if (op1 == 1 && op2 == 3) {
                cycles += this.decode_cb();
            } else if (op1 == 0 && op2 == 3) {
                // JP nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.pc = (imm2 << 8) | imm1;
            } else if ((op1 & 0x4) == 0 && op2 == 2) {
                // JP cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0x3)) {
                    this.pc = (imm2 << 8) | imm1;
                    cycles += 1;
                }
            } else if (op1 == 5 && op2 == 1) {
                // JP HL
                this.pc = this.hl;
            } else if (op1 == 1 && op2 == 5) {
                // CALL nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = (imm2 << 8) | imm1;
            } else if ((op1 & 0x4) == 0 && op2 == 4) {
                // CALL cc, nn
                const imm1 = this.readAddress(this.pc++);
                const imm2 = this.readAddress(this.pc++);
                if (this.readCondition(op1 & 0x3)) {
                    this.writeAddress(--this.sp, this.pch);
                    this.writeAddress(--this.sp, this.pcl);
                    this.pc = (imm2 << 8) | imm1;
                    cycles += 3;
                }
            } else if (op1 == 1 && op2 == 1) {
                // RET
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
            } else if (op1 == 3 && op2 == 1) {
                // RETI
                this.pc = this.readAddress(this.sp++);
                this.pc |= this.readAddress(this.sp++) << 8;
                this.ime = true;
            } else if ((op1 & 0x4) == 0 && op2 == 0) {
                // RET cc
                if (this.readCondition(op1 & 0x3)) {
                    this.pc = this.readAddress(this.sp++);
                    this.pc |= this.readAddress(this.sp++) << 8;
                    cycles += 3;
                }
            } else if (op2 == 7) {
                // RST t
                this.writeAddress(--this.sp, this.pch);
                this.writeAddress(--this.sp, this.pcl);
                this.pc = op1 << 3;
            } else if (op1 == 6 && op2 == 3) {
                // DI
                this.ime = false;
            } else if (op1 == 7 && op2 == 3) {
                // EI
                this.ime = true;
            } else {
                throw 'unknown instruction: 0x' + instr.toString(16);
            }
        }
        return cycles;
    }

    decode_cb() {
        const instr = this.readAddress(this.pc++);
        let cycles = GameBoy.cbInstrCycles[instr];
        const quad = instr >> 6, op1 = (instr & 0x3f) >> 3, op2 = instr & 0x7;
        if (quad == 0) {
            const r = this.readRegister(op2);
            if (op1 == 0) {
                // RLC r
                const carry = r & 0x80;
                const tmp = ((r << 1) | (carry >> 7)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 1) {
                // RRC r
                const carry = r & 0x1;
                const tmp = ((carry << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 2) {
                // RL r
                const carry = r & 0x80;
                const tmp = ((r << 1) | this.fc) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 3) {
                // RR r
                const carry = r & 0x1;
                const tmp = ((this.fc << 7) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 4) {
                // SLA r
                const carry = r & 0x80;
                const tmp = (r << 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 5) {
                // SRA r
                const carry = r & 0x1;
                const tmp = ((r & 0x80) | (r >> 1)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 6) {
                // SWAP r
                const tmp = ((r << 4) | (r >> 4)) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            } else if (op1 == 7) {
                // SRL r
                const carry = r & 0x1;
                const tmp = (r >> 1) & 0xff;
                this.writeRegister(op2, tmp);
                this.fc = carry != 0;
                this.fh = 0;
                this.fn = 0;
                this.fz = tmp == 0;
            }
        } else if (quad == 1) {
            // BIT b, r
            this.fh = true;
            this.fn = false;
            this.fz = (this.readRegister(op2) & (1 << op1)) == 0;
        } else if (quad == 2) {
            // RES b, r
            this.writeRegister(op2, this.readRegister(op2) & ~(1 << op1))
        } else if (quad == 3) {
            // SET b, r
            this.writeRegister(op2, this.readRegister(op2) | (1 << op1))
        }
        return cycles;
    }
}
GameBoy.frequency = 1048576;
GameBoy.instrCycles = [
    1, 3, 2, 2, 1, 1, 2, 1, 5, 2, 2, 2, 1, 1, 2, 1,
    0, 3, 2, 2, 1, 1, 2, 1, 3, 2, 2, 2, 1, 1, 2, 1,
    2, 3, 2, 2, 1, 1, 2, 1, 2, 2, 2, 2, 1, 1, 2, 1,
    2, 3, 2, 2, 3, 3, 3, 1, 2, 2, 2, 2, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    2, 2, 2, 2, 2, 2, 0, 2, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    1, 1, 1, 1, 1, 1, 2, 1, 1, 1, 1, 1, 1, 1, 2, 1,
    2, 3, 3, 4, 3, 4, 2, 4, 2, 4, 3, 0, 3, 6, 2, 4,
    2, 3, 3, 0, 3, 4, 2, 4, 2, 4, 3, 0, 3, 0, 2, 4,
    3, 3, 2, 0, 0, 4, 2, 4, 4, 1, 4, 0, 0, 0, 2, 4,
    3, 3, 2, 1, 0, 4, 2, 4, 3, 2, 4, 1, 0, 0, 2, 4,
];
GameBoy.cbInstrCycles = [
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 3, 2, 2, 2, 2, 2, 2, 2, 3, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
    2, 2, 2, 2, 2, 2, 4, 2, 2, 2, 2, 2, 2, 2, 4, 2,
];
GameBoy.joypadInterrupt = 0x10;
GameBoy.serialInterrupt = 0x8;
GameBoy.timerInterrupt = 0x4;
GameBoy.statInterrupt = 0x2;
GameBoy.vblankInterrupt = 0x1;
GameBoy.interrupts = 0x1f;

        

        class Display {
    constructor(gb) {
        this.gb = gb;

        this.lcdOn = true;
        this.windowTilemap = false;
        this.windowOn = false;
        this.bgWindowTileMode = true;
        this.bgTilemap = false;
        this.objHeight = false;
        this.objOn = false;
        this.bgOn = true;

        this.lycMatchInt = false;
        this.mode10Int = false;
        this.mode01Int = false;
        this.mode00Int = false;
        this.lycMatch = false;
        this.mode = 0;

        this.scy = 0;
        this.scx = 0;

        this.ly = 0;

        this.lyc = 0;

        this._bgp = 0;
        this._obp0 = 0;
        this._obp1 = 0;

        this.bgPalette = [0, 0, 0, 0];
        this.objPalette = [[0, 0, 0, 0], [0, 0, 0, 0]];

        this.bgColorIndex = 0;
        this.bgColorInc = false;

        this.objColorIndex = 0;
        this.objColorInc = false;

        this._bcpd = new Uint8Array(0x40);
        this._ocpd = new Uint8Array(0x40);

        this.bgColorPalette = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
        this.objColorPalette = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

        this.wy = 0;
        this.wx = 0;

        this._vbk = 0;

        this.hdmaSrc = 0;
        this.hdmaDst = 0;

        this._hdma5 = 0;

        this.hdmaOn = false;
        this.hblankHdmaOn = false;
        this.hdmaTrigger = false;
        this.hdmaCounter = 0;

        this.cycles = 0;
        this.windowLine = 0;

        this.statInterrupt = false;

        this.vram = new Uint8Array(0x4000);
        this.oam = new Uint8Array(0xa0);

        this.imageData = Display.ctx.createImageData(Display.canvasWidth, Display.canvasHeight);
        this.pixels = new Uint32Array(this.imageData.data.buffer);
        this.bgClear = new Uint8Array(Display.width);
        this.bgPriority = new Uint8Array(Display.width);
    }

    get lcdc() {
        return (this.lcdOn << 7) | (this.windowTilemap << 6) | (this.windowOn << 5) | (this.bgWindowTileMode << 4) | (this.bgTilemap << 3) | (this.objHeight << 2) | (this.objOn << 1) | this.bgOn;
    }

    set lcdc(value) {
        this.lcdOn = (value & 0x80) != 0;
        this.windowTilemap = (value & 0x40) != 0;
        this.windowOn = (value & 0x20) != 0;
        this.bgWindowTileMode = (value & 0x10) != 0;
        this.bgTilemap = (value & 0x8) != 0;
        this.objHeight = (value & 0x4) != 0;
        this.objOn = (value & 0x2) != 0;
        this.bgOn = (value & 0x1) != 0;
    }

    get stat() {
        return 0x80 | (this.lycMatchInt << 6) | (this.mode10Int << 5) | (this.mode01Int << 4) | (this.mode00Int << 3) | (this.lycMatch << 2) | this.mode;
    }

    set stat(value) {
        this.lycMatchInt = (value & 0x40) != 0;
        this.mode10Int = (value & 0x20) != 0;
        this.mode01Int = (value & 0x10) != 0;
        this.mode00Int = (value & 0x8) != 0;
    }

    set dma(value) {
        const src = value << 8;
        for (let index = 0; index < this.oam.length; index++) {
            this.oam[index] = this.gb.readAddress(src + index)
        }
    }

    get bgp() {
        return this._bgp;
    }

    set bgp(value) {
        this._bgp = value;
        this.bgPalette = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    get obp0() {
        return this._obp0;
    }

    set obp0(value) {
        this._obp0 = value;
        this.objPalette[0] = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    get obp1() {
        return this._obp1;
    }

    set obp1(value) {
        this._obp1 = value;
        this.objPalette[1] = [value & 0x3, (value >> 2) & 0x3, (value >> 4) & 0x3, (value >> 6) & 0x3];
    }

    set hdma1(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.hdmaSrc = (value << 8) | (this.hdmaSrc & 0x00ff);
    }

    set hdma2(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.hdmaSrc = (this.hdmaSrc & 0xff00) | (value & 0xf0);
    }

    set hdma3(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.hdmaDst = ((value & 0x1f) << 8) | (this.hdmaDst & 0x00ff);
    }

    set hdma4(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.hdmaDst = (this.hdmaDst & 0xff00) | (value & 0xf0);
    }

    get hdma5() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return ((!this.hdmaOn && !this.hblankHdmaOn) << 7) | ((this.hdmaCounter - 1) & 0x7f);
    }

    set hdma5(value) {
        if (!this.gb.cgb) {
            return;
        }
        if ((value & 0x80) == 0 && this.hblankHdmaOn) {
            this.hblankHdmaOn = false;
            return;
        }
        this.hdmaOn = (value & 0x80) == 0;
        this.hblankHdmaOn = (value & 0x80) != 0;
        if (this.hblankHdmaOn && this.mode == Display.modes.hblank) {
            this.hdmaOn = true;
        }
        this._hdma5 = value;
        this.hdmaCounter = (value & 0x7f) + 1;
    }

    get bcps() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return 0x40 | (this.bgColorInc << 7) | this.bgColorIndex;
    }

    set bcps(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.bgColorInc = (value & 0x80) != 0;
        this.bgColorIndex = value & 0x3f;
    }

    get bcpd() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return this._bcpd[this.bgColorIndex];
    }

    set bcpd(value) {
        if (!this.gb.cgb) {
            return;
        }
        this._bcpd[this.bgColorIndex] = value;
        if ((this.bgColorIndex & 0x1) != 0) {
            this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] = ((value & 0x7f) << 8) | (this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] & 0xff)
        } else {
            this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] = (this.bgColorPalette[this.bgColorIndex >> 3][(this.bgColorIndex & 0x6) >> 1] & 0xff00) | value;
        }
        if (this.bgColorInc) {
            this.bgColorIndex = (this.bgColorIndex + 1) & 0x3f;
        }
    }

    get ocps() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return 0x40 | (this.objColorInc << 7) | this.objColorIndex;
    }

    set ocps(value) {
        if (!this.gb.cgb) {
            return;
        }
        this.objColorInc = (value & 0x80) != 0;
        this.objColorIndex = value & 0x3f;
    }

    get ocpd() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return this._ocpd[this.objColorIndex];
    }

    set ocpd(value) {
        if (!this.gb.cgb) {
            return;
        }
        this._ocpd[this.objColorIndex] = value;
        if ((this.objColorIndex & 0x1) != 0) {
            this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] = ((value & 0x7f) << 8) | (this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] & 0xff)
        } else {
            this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] = (this.objColorPalette[this.objColorIndex >> 3][(this.objColorIndex & 0x6) >> 1] & 0xff00) | value;
        }
        if (this.objColorInc) {
            this.objColorIndex = (this.objColorIndex + 1) & 0x3f;
        }
    }

    get vbk() {
        if (!this.gb.cgb) {
            return 0xff;
        }
        return 0xfe | this._vbk;
    }

    set vbk(value) {
        if (!this.gb.cgb) {
            return;
        }
        this._vbk = value & 0x1;
    }

    readVRAM(address) {
        return this.vram[(this._vbk << 13) | address];
    }

    writeVRAM(address, value) {
        this.vram[(this._vbk << 13) | address] = value;
    }

    renderLine() {
        const address = (this.ly + Display.canvasMargin) * Display.canvasWidth + Display.canvasMargin;
        for (let x = 0; x < Display.width; x++) {
            if (this.bgOn) {
                if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                    const tilemapY = (this.windowLine >> 3) & 0x1f;
                    const tilemapX = ((x - (this.wx - 7)) >> 3) & 0x1f;
                    const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = this.windowLine & 0x7;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x - (this.wx - 7)) & 0x7;
                    const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                    this.bgClear[x] = palette;
                    this.pixels[address + x] = Display.palette[this.bgPalette[palette]];
                } else {
                    const tilemapY = ((this.ly + this.scy) >> 3) & 0x1f;
                    const tilemapX = ((x + this.scx) >> 3) & 0x1f;
                    const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;

                    let tile = this.vram[tilemapAddress];
                    if (!this.bgWindowTileMode && tile < 0x80) {
                        tile += 0x100;
                    }
                    const tileY = (this.ly + this.scy) & 0x7;
                    const tileAddress = (tile << 4) | (tileY << 1);

                    const tileX = (x + this.scx) & 0x7;
                    const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                    this.bgClear[x] = palette;
                    this.pixels[address + x] = Display.palette[this.bgPalette[palette]];
                }
            } else {
                this.bgClear[x] = 0;
                this.pixels[address + x] = 0xffffffff;
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tileY = (this.ly - objY) & 0xff;
                if (tileY < (this.objHeight ? 16 : 8)) {
                    let index = objs.length;
                    const compObjX = this.oam[objs[index - 1] * 4 + 1] - 8;
                    while (index > 0 && objX < compObjX) {
                        index--;
                    }
                    objs.splice(index, 0, obj);
                }
            }

            for (let index = objs.length - 1; index >= 0; index--) {
                const obj = objs[index];
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tile = this.oam[obj * 4 + 2] & (this.objHeight ? 0xfe : 0xff);
                const attr = this.oam[obj * 4 + 3];
                const priority = (attr & 0x80) != 0;
                const yFlip = (attr & 0x40) != 0;
                const xFlip = (attr & 0x20) != 0;
                const paletteNumber = (attr & 0x10) >> 4;

                if (objX > -8 && objX < Display.width) {
                    let tileY = this.ly - objY;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = (tile << 4) | (tileY << 1);

                    for (let x = Math.max(objX, 0); x < Math.min(objX + 8, Display.width); x++) {
                        let tileX = x - objX;
                        if (xFlip) {
                            tileX = 7 - tileX;
                        }
                        const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                        if (palette != 0 && (!priority || this.bgClear[x] == 0)) {
                            this.pixels[address + x] = Display.palette[this.objPalette[paletteNumber][palette]];
                        }
                    }
                }
            }
        }
    }

    renderLineColor() {
        const address = (this.ly + Display.canvasMargin) * Display.canvasWidth + Display.canvasMargin;
        for (let x = 0; x < Display.width; x++) {
            if (this.windowOn && this.ly >= this.wy && x >= this.wx - 7) {
                const tilemapY = (this.windowLine >> 3) & 0x1f;
                const tilemapX = ((x - (this.wx - 7)) >> 3) & 0x1f;
                const tilemapAddress = (this.windowTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;
                const tileAttributeAddress = 0x2000 | tilemapAddress;

                const attributes = this.vram[tileAttributeAddress];
                this.bgPriority[x] = (attributes & 0x80) != 0;
                const yFlip = (attributes & 0x40) != 0;
                const xFlip = (attributes & 0x20) != 0;
                const bankAddress = (attributes & 0x8) << 10;
                const paletteNumber = attributes & 0x7;

                let tile = this.vram[tilemapAddress];
                if (!this.bgWindowTileMode && tile < 0x80) {
                    tile += 0x100;
                }
                let tileY = this.windowLine & 0x7;
                if (yFlip) {
                    tileY = 7 - tileY;
                }
                const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                let tileX = (x - (this.wx - 7)) & 0x7;
                if (xFlip) {
                    tileX = 7 - tileX;
                }
                const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                this.bgClear[x] = palette;
                this.pixels[address + x] = Display.colorPalette[this.bgColorPalette[paletteNumber][palette]];
            } else {
                const tilemapY = ((this.ly + this.scy) >> 3) & 0x1f;
                const tilemapX = ((x + this.scx) >> 3) & 0x1f;
                const tilemapAddress = (this.bgTilemap ? 0x1c00 : 0x1800) | (tilemapY << 5) | tilemapX;
                const tileAttributeAddress = 0x2000 | tilemapAddress;

                const attributes = this.vram[tileAttributeAddress];
                this.bgPriority[x] = (attributes & 0x80) != 0;
                const yFlip = (attributes & 0x40) != 0;
                const xFlip = (attributes & 0x20) != 0;
                const bankAddress = (attributes & 0x8) << 10;
                const paletteNumber = attributes & 0x7;

                let tile = this.vram[tilemapAddress];
                if (!this.bgWindowTileMode && tile < 0x80) {
                    tile += 0x100;
                }
                let tileY = (this.ly + this.scy) & 0x7;
                if (yFlip) {
                    tileY = 7 - tileY;
                }
                const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                let tileX = (x + this.scx) & 0x7;
                if (xFlip) {
                    tileX = 7 - tileX;
                }
                const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                this.bgClear[x] = palette;
                this.pixels[address + x] = Display.colorPalette[this.bgColorPalette[paletteNumber][palette]];
            }
        }

        if (this.objOn) {
            const objs = [];
            for (let obj = 0; obj < 40 && objs.length < 10; obj++) {
                const objY = this.oam[obj * 4] - 16;
                const tileY = (this.ly - objY) & 0xff;
                if (tileY < (this.objHeight ? 16 : 8)) {
                    objs.push(obj);
                }
            }

            for (let index = objs.length - 1; index >= 0; index--) {
                const obj = objs[index];
                const objY = this.oam[obj * 4] - 16;
                const objX = this.oam[obj * 4 + 1] - 8;
                const tile = this.oam[obj * 4 + 2] & (this.objHeight ? 0xfe : 0xff);
                const attr = this.oam[obj * 4 + 3];
                const priority = (attr & 0x80) != 0;
                const yFlip = (attr & 0x40) != 0;
                const xFlip = (attr & 0x20) != 0;
                const bankAddress = (attr & 0x8) << 10;
                const paletteNumber = attr & 0x7;

                if (objX > -8 && objX < Display.width) {
                    let tileY = this.ly - objY;
                    if (yFlip) {
                        tileY = (this.objHeight ? 15 : 7) - tileY;
                    }
                    const tileAddress = bankAddress | (tile << 4) | (tileY << 1);

                    for (let x = Math.max(objX, 0); x < Math.min(objX + 8, Display.width); x++) {
                        let tileX = x - objX;
                        if (xFlip) {
                            tileX = 7 - tileX;
                        }
                        const palette = (((this.vram[tileAddress + 1] << tileX) & 0x80) >> 6) | (((this.vram[tileAddress] << tileX) & 0x80) >> 7);

                        if (palette != 0 && (!this.bgOn || this.bgClear[x] == 0 || (this.bgPriority[x] == 0 && !priority))) {
                            this.pixels[address + x] = Display.colorPalette[this.objColorPalette[paletteNumber][palette]];
                        }
                    }
                }
            }
        }
    }

    renderFrame() {
        Display.ctx.putImageData(this.imageData, 0, 0);
    }

    cycle() {
        if (this.lcdOn) {
            this.lycMatch = this.ly == this.lyc;

            if (this.ly < Display.height) {
                if (this.cycles == 0) {
                    this.mode = Display.modes.searchOAM;
                }
                if (this.cycles == 80) {
                    this.mode = Display.modes.transfer;
                }
                if (this.cycles == 248) {
                    this.mode = Display.modes.hblank;
                    if (this.gb.cgb) {
                        this.renderLineColor();
                    } else {
                        this.renderLine();
                    }
                    if (this.hblankHdmaOn) {
                        this.hdmaTrigger = true;
                    }
                }
            }
            if (this.ly == Display.height && this.cycles == 0) {
                this.gb.requestInterrupt(GameBoy.vblankInterrupt);
                this.mode = Display.modes.vblank;
                this.renderFrame();
            }

            const _statInterrupt = this.statInterrupt;
            this.statInterrupt = (this.lycMatchInt && this.lycMatch) || (this.mode10Int && this.mode == Display.modes.searchOAM) || (this.mode01Int && this.mode == Display.modes.vblank) || (this.mode00Int && this.mode == Display.modes.hblank);
            if (!_statInterrupt && this.statInterrupt) {
                this.gb.requestInterrupt(GameBoy.statInterrupt);
            }

            this.cycles += Display.cyclesPerCPUCycle;
            if (this.cycles == Display.cyclesPerLine) {
                this.cycles = 0;
                if (this.windowOn && this.ly >= this.wy && this.wx <= 166) {
                    this.windowLine++;
                }
                this.ly++;
                if (this.ly == Display.linesPerFrame) {
                    this.ly = 0;
                    this.windowLine = 0;
                }
            }
        } else {
            this.cycles = 0;
            this.ly = 0;
            this.lycMatch = false;
            this.mode = Display.modes.hblank;
        }
    }
}
Display.width = 160;
Display.height = 144;
Display.frequency = 4194304;
Display.cyclesPerLine = 456;
Display.linesPerFrame = 154;
Display.cyclesPerCPUCycle = Display.frequency / GameBoy.frequency;
Display.cpuCyclesPerFrame = Display.cyclesPerLine * Display.linesPerFrame / Display.cyclesPerCPUCycle;
Display.frameDuration = Display.cpuCyclesPerFrame / GameBoy.frequency;
Display.frameInterval = Display.frameDuration * 1000;
Display.palette = [
    0xffffffff, 0xffaaaaaa, 0xff555555, 0xff000000,
];
Display.colorPalette = Array.from(Array(0x8000), (v, k) => {
    const b = Math.floor((k >> 10) * 0xff / 0x1f);
    const g = Math.floor(((k & 0x3e0) >> 5) * 0xff / 0x1f);
    const r = Math.floor((k & 0x1f) * 0xff / 0x1f);
    return 0xff000000 | (b << 16) | (g << 8) | r;
});
Display.modes = {
    hblank: 0,
    vblank: 1,
    searchOAM: 2,
    transfer: 3,
}
Display.canvasMargin = 16;
Display.canvasWidth = Display.width + 2 * Display.canvasMargin;
Display.canvasHeight = Display.height + 2 * Display.canvasMargin;
Display.canvas = document.getElementById('canvas');
Display.canvas.width = Display.canvasWidth;
Display.canvas.height = Display.canvasHeight;
Display.ctx = Display.canvas.getContext('2d');

        

        class Sound {
    constructor(gb) {
        this.gb = gb;

        this.channel3WaveTable = [
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ];

        this.cycles = 0;
        this.frame = 0;

        this.clearState();

        this.soundEnable = false;

        this.gainNode = Sound.ctx.createGain();
        this.gainNode.gain.value = Sound.volume;
        this.gainNode.connect(Sound.ctx.destination);

        this.buffer = Sound.ctx.createBuffer(2, Sound.bufferSamples, Sound.sampleFrequency);
        this.bufferLeft = this.buffer.getChannelData(0);
        this.bufferRight = this.buffer.getChannelData(1);
    }

    get nr10() {
        return 0x80 | (this.channel1SweepDuration << 4) | (this.channel1SweepDown << 3) | this.channel1SweepShift;
    }

    set nr10(value) {
        this.channel1SweepDuration = (value & 0x70) >> 4;
        this.channel1SweepDown = (value & 0x8) != 0;
        this.channel1SweepShift = value & 0x7;
    }

    get nr11() {
        return 0x3f | (this.channel1Duty << 6);
    }

    set nr11(value) {
        this.channel1Duty = (value & 0xc0) >> 6;
        this.channel1LengthCounter = 64 - (value & 0x3f);
    }

    get nr12() {
        return (this.channel1InitialVolume << 4) | (this.channel1VolumeUp << 3) | this.channel1EnvelopeDuration;
    }

    set nr12(value) {
        this.channel1InitialVolume = (value & 0xf0) >> 4;
        this.channel1VolumeUp = (value & 0x8) != 0;
        this.channel1EnvelopeDuration = value & 0x7;
    }

    get nr13() {
        return 0xff;
    }

    set nr13(value) {
        this.channel1Frequency = (this.channel1Frequency & 0x700) | value;
    }

    get nr14() {
        return 0xbf | (this.channel1LengthEnable << 6);
    }

    set nr14(value) {
        this.channel1Trigger = (value & 0x80) != 0;
        this.channel1LengthEnable = (value & 0x40) != 0;
        this.channel1Frequency = ((value & 0x7) << 8) | (this.channel1Frequency & 0xff);
    }

    get nr21() {
        return 0x3f | (this.channel2Duty << 6);
    }

    set nr21(value) {
        this.channel2Duty = (value & 0xc0) >> 6;
        this.channel2LengthCounter = 64 - (value & 0x3f);
    }

    get nr22() {
        return (this.channel2InitialVolume << 4) | (this.channel2VolumeUp << 3) | this.channel2EnvelopeDuration;
    }

    set nr22(value) {
        this.channel2InitialVolume = (value & 0xf0) >> 4;
        this.channel2VolumeUp = (value & 0x8) != 0;
        this.channel2EnvelopeDuration = value & 0x7;
    }

    get nr23() {
        return 0xff;
    }

    set nr23(value) {
        this.channel2Frequency = (this.channel2Frequency & 0x700) | value;
    }

    get nr24() {
        return 0xbf | (this.channel2LengthEnable << 6);
    }

    set nr24(value) {
        this.channel2Trigger = (value & 0x80) != 0;
        this.channel2LengthEnable = (value & 0x40) != 0;
        this.channel2Frequency = ((value & 0x7) << 8) | (this.channel2Frequency & 0xff);
    }

    get nr30() {
        return 0x7f | (this.channel3Play << 7);
    }

    set nr30(value) {
        this.channel3Play = (value & 0x80) != 0;
    }

    get nr31() {
        return 0xff;
    }

    set nr31(value) {
        this.channel3LengthCounter = 256 - value;
    }

    get nr32() {
        return 0x9f | (this.channel3Volume << 5);
    }

    set nr32(value) {
        this.channel3Volume = (value & 0x60) >> 5;
    }

    get nr33() {
        return 0xff;
    }

    set nr33(value) {
        this.channel3Frequency = (this.channel3Frequency & 0x700) | value;
    }

    get nr34() {
        return 0xbf | (this.channel3LengthEnable << 6);
    }

    set nr34(value) {
        this.channel3Trigger = (value & 0x80) != 0;
        this.channel3LengthEnable = (value & 0x40) != 0;
        this.channel3Frequency = ((value & 0x7) << 8) | (this.channel3Frequency & 0xff);
    }

    get nr41() {
        return 0xff;
    }

    set nr41(value) {
        this.channel4LengthCounter = 64 - (value & 0x3f);
    }

    get nr42() {
        return (this.channel4InitialVolume << 4) | (this.channel4VolumeUp << 3) | this.channel4EnvelopeDuration;
    }

    set nr42(value) {
        this.channel4InitialVolume = (value & 0xf0) >> 4;
        this.channel4VolumeUp = (value & 0x8) != 0;
        this.channel4EnvelopeDuration = value & 0x7;
    }

    get nr43() {
        return (this.channel4ShiftClockFrequency << 4) | (this.channel4CounterStep << 3) | this.channel4DivisionRatio;
    }

    set nr43(value) {
        this.channel4ShiftClockFrequency = (value & 0xf0) >> 4;
        this.channel4CounterStep = (value & 0x8) != 0;
        this.channel4DivisionRatio = value & 0x7;
    }

    get nr44() {
        return 0xbf | (this.channel4LengthEnable << 6);
    }

    set nr44(value) {
        this.channel4Trigger = (value & 0x80) != 0;
        this.channel4LengthEnable = (value & 0x40) != 0;
    }

    get nr50() {
        return (this.outputVinRight << 7) | (this.rightVolume << 4) | (this.outputVinLeft << 3) | this.leftVolume;
    }

    set nr50(value) {
        this.outputVinRight = (value & 0x80) != 0;
        this.rightVolume = (value & 0x70) >> 4;
        this.outputVinLeft = (value & 0x8) != 0;
        this.leftVolume = value & 0x7;
    }

    get nr51() {
        return (this.channel4RightEnable << 7) | (this.channel3RightEnable << 6) | (this.channel2RightEnable << 5) | (this.channel1RightEnable << 4) | (this.channel4LeftEnable << 3) | (this.channel3LeftEnable << 2) | (this.channel2LeftEnable << 1) | this.channel1LeftEnable;
    }

    set nr51(value) {
        this.channel4RightEnable = (value & 0x80) != 0;
        this.channel3RightEnable = (value & 0x40) != 0;
        this.channel2RightEnable = (value & 0x20) != 0;
        this.channel1RightEnable = (value & 0x10) != 0;
        this.channel4LeftEnable = (value & 0x8) != 0;
        this.channel3LeftEnable = (value & 0x4) != 0;
        this.channel2LeftEnable = (value & 0x2) != 0;
        this.channel1LeftEnable = (value & 0x1) != 0;
    }

    get nr52() {
        return 0x70 | (this.soundEnable << 7) | (this.channel4Enable << 3) | (this.channel3Enable << 2) | (this.channel2Enable << 1) | this.channel1Enable;
    }

    set nr52(value) {
        this.soundEnable = (value & 0x80) != 0;
        if (!this.soundEnable) {
            this.clearState();
        }
    }

    readAddress(address) {
        if (address <= 0x2f) {
            switch (address) {
                case 0x10: return this.nr10;
                case 0x11: return this.nr11;
                case 0x12: return this.nr12;
                case 0x13: return this.nr13;
                case 0x14: return this.nr14;
                case 0x16: return this.nr21;
                case 0x17: return this.nr22;
                case 0x18: return this.nr23;
                case 0x19: return this.nr24;
                case 0x1a: return this.nr30;
                case 0x1b: return this.nr31;
                case 0x1c: return this.nr32;
                case 0x1d: return this.nr33;
                case 0x1e: return this.nr34;
                case 0x20: return this.nr41;
                case 0x21: return this.nr42;
                case 0x22: return this.nr43;
                case 0x23: return this.nr44;
                case 0x24: return this.nr50;
                case 0x25: return this.nr51;
                case 0x26: return this.nr52;
                default: return 0xff;
            }
        } else {
            return this.readWave(address & 0xf);
        }
    }

    writeAddress(address, value) {
        if (this.soundEnable) {
            if (address <= 0x2f) {
                switch (address) {
                    case 0x10: this.nr10 = value; break;
                    case 0x11: this.nr11 = value; break;
                    case 0x12: this.nr12 = value; break;
                    case 0x13: this.nr13 = value; break;
                    case 0x14: this.nr14 = value; break;
                    case 0x16: this.nr21 = value; break;
                    case 0x17: this.nr22 = value; break;
                    case 0x18: this.nr23 = value; break;
                    case 0x19: this.nr24 = value; break;
                    case 0x1a: this.nr30 = value; break;
                    case 0x1b: this.nr31 = value; break;
                    case 0x1c: this.nr32 = value; break;
                    case 0x1d: this.nr33 = value; break;
                    case 0x1e: this.nr34 = value; break;
                    case 0x20: this.nr41 = value; break;
                    case 0x21: this.nr42 = value; break;
                    case 0x22: this.nr43 = value; break;
                    case 0x23: this.nr44 = value; break;
                    case 0x24: this.nr50 = value; break;
                    case 0x25: this.nr51 = value; break;
                    case 0x26: this.nr52 = value; break;
                    default: break;
                }
            } else {
                this.writeWave(address & 0xf, value);
            }
        } else if (address == 0x26) {
            this.nr52 = value;
        }
    }

    readWave(address) {
        return (this.channel3WaveTable[address * 2] << 4) | this.channel3WaveTable[address * 2 + 1];
    }

    writeWave(address, value) {
        this.channel3WaveTable[address * 2] = (value & 0xf0) >> 4;
        this.channel3WaveTable[address * 2 + 1] = value & 0xf;
    }

    clearState() {
        this.frame = 0;
        this.channel1Enable = false;
        this.channel2Enable = false;
        this.channel3Enable = false;
        this.channel4Enable = false;
        this.channel1SweepDuration = 0;
        this.channel1SweepDown = false;
        this.channel1SweepShift = 0;
        this.channel1SweepEnable = false;
        this.channel1Duty = 0;
        this.channel1InitialVolume = 0;
        this.channel1VolumeUp = false;
        this.channel1EnvelopeDuration = 0;
        this.channel1Frequency = 0;
        this.channel1Trigger = false;
        this.channel1LengthEnable = false;
        this.channel2Duty = 0;
        this.channel2InitialVolume = 0;
        this.channel2VolumeUp = false;
        this.channel2EnvelopeDuration = 0;
        this.channel2Frequency = 0;
        this.channel2Trigger = false;
        this.channel2LengthEnable = false;
        this.channel3Play = false;
        this.channel3Volume = 0;
        this.channel3Frequency = 0;
        this.channel3Trigger = false;
        this.channel3LengthEnable = false;
        this.channel4InitialVolume = 0;
        this.channel4VolumeUp = false;
        this.channel4EnvelopeDuration = 0;
        this.channel4ShiftClockFrequency = 0;
        this.channel4CounterStep = false;
        this.channel4DivisionRatio = 0;
        this.channel4Trigger = false;
        this.channel4LengthEnable = false;
        this.outputVinRight = false;
        this.rightVolume = 0;
        this.outputVinLeft = false;
        this.leftVolume = 0;
        this.channel1LeftEnable = false;
        this.channel2LeftEnable = false;
        this.channel3LeftEnable = false;
        this.channel4LeftEnable = false;
        this.channel1RightEnable = false;
        this.channel2RightEnable = false;
        this.channel3RightEnable = false;
        this.channel4RightEnable = false;
    }

    genLFSR() {
        const tmp = ((this.channel4LFSR & 0x2) >> 1) ^ (this.channel4LFSR & 0x1);
        this.channel4LFSR = (tmp << 14) | (this.channel4LFSR >> 1);
        if (this.channel4CounterStep) {
            this.channel4LFSR = (this.channel4LFSR & 0x7fbf) | (tmp << 6);
        }
    }

    updateLength() {
        if (this.channel1LengthEnable) {
            this.channel1LengthCounter--;
            if (this.channel1LengthCounter == 0) {
                this.channel1Enable = false;
            }
        }
        if (this.channel2LengthEnable) {
            this.channel2LengthCounter--;
            if (this.channel2LengthCounter == 0) {
                this.channel2Enable = false;
            }
        }
        if (this.channel3LengthEnable) {
            this.channel3LengthCounter--;
            if (this.channel3LengthCounter == 0) {
                this.channel3Enable = false;
            }
        }
        if (this.channel4LengthEnable) {
            this.channel4LengthCounter--;
            if (this.channel4LengthCounter == 0) {
                this.channel4Enable = false;
            }
        }
    }

    updateSweep() {
        this.channel1SweepCounter--;
        if (this.channel1SweepCounter <= 0) {
            this.channel1SweepCounter = this.channel1SweepDuration;
            if (this.channel1SweepDuration != 0 && this.channel1SweepEnable) {
                let tmp = this.channel1SweepFrequency + (this.channel1SweepDown ? -1 : 1) * (this.channel1SweepFrequency >> this.channel1SweepShift);
                if (tmp > 2047) {
                    this.channel1Enable = false;
                } else if (this.channel1SweepShift != 0) {
                    this.channel1Frequency = this.channel1SweepFrequency = tmp;
                    tmp = tmp + (this.channel1SweepDown ? -1 : 1) * (tmp >> this.channel1SweepShift);
                    if (tmp > 2047) {
                        this.channel1Enable = false;
                    }
                }
            }
        }
    }

    updateVolume() {
        if (this.channel1Enable && this.channel1EnvelopeDuration != 0) {
            this.channel1EnvelopeCounter--;
            if (this.channel1EnvelopeCounter == 0) {
                this.channel1EnvelopeCounter = this.channel1EnvelopeDuration;
                if (this.channel1VolumeUp && this.channel1Volume < 15) {
                    this.channel1Volume++;
                }
                if (!this.channel1VolumeUp && this.channel1Volume > 0) {
                    this.channel1Volume--;
                }
            }
        }
        if (this.channel2Enable && this.channel2EnvelopeDuration != 0) {
            this.channel2EnvelopeCounter--;
            if (this.channel2EnvelopeCounter == 0) {
                this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
                if (this.channel2VolumeUp && this.channel2Volume < 15) {
                    this.channel2Volume++;
                }
                if (!this.channel2VolumeUp && this.channel2Volume > 0) {
                    this.channel2Volume--;
                }
            }
        }
        if (this.channel4Enable && this.channel4EnvelopeDuration != 0) {
            this.channel4EnvelopeCounter--;
            if (this.channel4EnvelopeCounter == 0) {
                this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
                if (this.channel4VolumeUp && this.channel4Volume < 15) {
                    this.channel4Volume++;
                }
                if (!this.channel4VolumeUp && this.channel4Volume > 0) {
                    this.channel4Volume--;
                }
            }
        }
    }

    updateTrigger() {
        if (this.channel1Trigger) {
            this.channel1Trigger = false;
            this.channel1Enable = true;
            this.channel1FrequencyCounter = (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
            if (this.channel1LengthCounter == 0) {
                this.channel1LengthCounter = 64;
            }
            this.channel1SweepFrequency = this.channel1Frequency;
            this.channel1SweepCounter = this.channel1SweepDuration;
            this.channel1SweepEnable = this.channel1SweepDuration != 0 || this.channel1SweepShift != 0;
            this.channel1EnvelopeCounter = this.channel1EnvelopeDuration;
            this.channel1Volume = this.channel1InitialVolume;
            this.channel1Index = 0;
            if (this.channel1SweepShift > 0) {
                const tmp = this.channel1SweepFrequency + (this.channel1SweepDown ? -1 : 1) * (this.channel1SweepFrequency >> this.channel1SweepShift);
                if (tmp > 2047) {
                    this.channel1Enable = false;
                } else if (tmp >= 0) {
                    this.channel1Frequency = this.channel1SweepFrequency = tmp;
                }
            }
        }
        if (this.channel2Trigger) {
            this.channel2Trigger = false;
            this.channel2Enable = true;
            this.channel2FrequencyCounter = (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
            if (this.channel2LengthCounter == 0) {
                this.channel2LengthCounter = 64;
            }
            this.channel2EnvelopeCounter = this.channel2EnvelopeDuration;
            this.channel2Volume = this.channel2InitialVolume;
            this.channel2Index = 0;
        }
        if (this.channel3Trigger) {
            this.channel3Trigger = false;
            this.channel3Enable = true;
            this.channel3FrequencyCounter = (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
            if (this.channel3LengthCounter == 0) {
                this.channel3LengthCounter = 256;
            }
            this.channel3Index = 0;
        }
        if (this.channel4Trigger) {
            this.channel4Trigger = false;
            this.channel4Enable = true;
            this.channel4FrequencyCounter = Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
            if (this.channel4LengthCounter == 0) {
                this.channel4LengthCounter = 64;
            }
            this.channel4EnvelopeCounter = this.channel4EnvelopeDuration;
            this.channel4Volume = this.channel4InitialVolume;
            this.channel4LFSR = 0x7fff;
        }
    }

    updateDAC() {
        if (this.channel1Enable && this.channel1InitialVolume == 0 && !this.channel1VolumeUp) {
            this.channel1Enable = false;
        }
        if (this.channel2Enable && this.channel2InitialVolume == 0 && !this.channel2VolumeUp) {
            this.channel2Enable = false;
        }
        if (this.channel3Enable && !this.channel3Play) {
            this.channel3Enable = false;
        }
        if (this.channel4Enable && this.channel4InitialVolume == 0 && !this.channel4VolumeUp) {
            this.channel4Enable = false;
        }
    }

    updateFrequency() {
        let left = 0;
        let right = 0;
        if (this.channel1Enable) {
            this.channel1FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel1FrequencyCounter <= 0) {
                this.channel1FrequencyCounter += (2048 - this.channel1Frequency) * Sound.cyclesPerPulse;
                this.channel1Index = (this.channel1Index + 1) % 8;
            }
            if (this.channel1Volume != 0) {
                const signal = Sound.pulseTable[this.channel1Duty][this.channel1Index] * this.channel1Volume / 15 * 2 - 1;
                if (this.channel1LeftEnable) {
                    left += signal;
                }
                if (this.channel1RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel2Enable) {
            this.channel2FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel2FrequencyCounter <= 0) {
                this.channel2FrequencyCounter += (2048 - this.channel2Frequency) * Sound.cyclesPerPulse;
                this.channel2Index = (this.channel2Index + 1) % 8;
            }
            if (this.channel2Volume != 0) {
                const signal = Sound.pulseTable[this.channel2Duty][this.channel2Index] * this.channel2Volume / 15 * 2 - 1;
                if (this.channel2LeftEnable) {
                    left += signal;
                }
                if (this.channel2RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel3Enable) {
            this.channel3FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel3FrequencyCounter <= 0) {
                this.channel3FrequencyCounter += (2048 - this.channel3Frequency) * Sound.cyclesPerWave;
                this.channel3Index = (this.channel3Index + 1) % 32;
            }
            if (this.channel3Volume != 0) {
                const signal = (this.channel3WaveTable[this.channel3Index] >> Sound.volumeShift[this.channel3Volume]) / 15 * 2 - 1;
                if (this.channel3LeftEnable) {
                    left += signal;
                }
                if (this.channel3RightEnable) {
                    right += signal;
                }
            }
        }
        if (this.channel4Enable) {
            this.channel4FrequencyCounter -= Sound.cyclesPerSample;
            while (this.channel4FrequencyCounter <= 0) {
                this.channel4FrequencyCounter += Sound.divisionRatios[this.channel4DivisionRatio] << this.channel4ShiftClockFrequency;
                this.genLFSR();
            }
            if (this.channel4Volume != 0) {
                const signal = (~this.channel4LFSR & 0b1) * this.channel4Volume / 15 * 2 - 1;
                if (this.channel4LeftEnable) {
                    left += signal;
                }
                if (this.channel4RightEnable) {
                    right += signal;
                }
            }
        }
        left *= (this.leftVolume + 1) / 8;
        right *= (this.rightVolume + 1) / 8;

        this.bufferLeft[(this.cycles / Sound.cyclesPerSample) % Sound.bufferSamples] = left / Sound.channelCount;
        this.bufferRight[(this.cycles / Sound.cyclesPerSample) % Sound.bufferSamples] = right / Sound.channelCount;
    }

    pushBuffer() {
        const now = Sound.ctx.currentTime;
        const nowPlusDelay = now + Sound.latency;
        this.nextPush = this.nextPush || nowPlusDelay;
        if (this.nextPush >= now) {
            const bufferSource = Sound.ctx.createBufferSource();
            bufferSource.buffer = this.buffer;
            bufferSource.connect(this.gainNode);
            bufferSource.start(this.nextPush);
            this.nextPush += Sound.bufferDuration;

            this.buffer = Sound.ctx.createBuffer(2, Sound.bufferSamples, Sound.sampleFrequency);
            this.bufferLeft = this.buffer.getChannelData(0);
            this.bufferRight = this.buffer.getChannelData(1);
        } else {
            this.nextPush = nowPlusDelay;
        }
    }

    cycle() {
        this.cycles += Sound.cyclesPerCPUCycle;
        if (this.soundEnable) {
            if (this.cycles % Sound.cyclesPerSample == 0) {
                this.updateTrigger();
                this.updateDAC();
                this.updateFrequency();
            }
            if (this.cycles % Sound.cyclesPerBuffer == 0) {
                this.pushBuffer();
            }
            if (this.cycles % Sound.cyclesPerFrame == 0) {
                this.frame++;
                switch (this.frame % 8) {
                    case 2:
                    case 6:
                        this.updateSweep();
                    case 0:
                    case 4:
                        this.updateLength();
                        break;
                    case 7:
                        this.updateVolume();
                        break;
                }
            }
        }
    }
}
Sound.frequency = 4194304;
Sound.cyclesPerCPUCycle = Sound.frequency / GameBoy.frequency;
Sound.pulseFrequency = 1048576;
Sound.cyclesPerPulse = Sound.frequency / Sound.pulseFrequency;
Sound.waveFrequency = 2097152;
Sound.cyclesPerWave = Sound.frequency / Sound.waveFrequency;
Sound.bufferSamples = 4096;
Sound.sampleFrequency = 65536;
Sound.bufferDuration = Sound.bufferSamples / Sound.sampleFrequency;
Sound.latency = 0.125;
Sound.volume = 0.25;
Sound.frameFrequency = 512;
Sound.cyclesPerFrame = Sound.frequency / Sound.frameFrequency;
Sound.cyclesPerSample = Sound.frequency / Sound.sampleFrequency;
Sound.cyclesPerBuffer = Sound.cyclesPerSample * Sound.bufferSamples;
Sound.channelCount = 4;
Sound.pulseTable = [
    [0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 1],
    [0, 1, 1, 1, 1, 1, 1, 0],
];
Sound.volumeShift = [
    4, 0, 1, 2,
];
Sound.divisionRatios = [
    2, 4, 8, 12, 16, 20, 24, 28,
].map((value => value * Sound.cyclesPerCPUCycle));
Sound.ctx = new (window.AudioContext || window.webkitAudioContext)();

        

        class Timer {
    constructor(gb) {
        this.gb = gb;

        this._div = 0;
        this._tima = 0;
        this._tma = 0;
        this.timerEnable = false;
        this.clockSelect = 0;

        this.overflow = false;
    }

    get div() {
        return this._div >> 8;
    }

    set div(value) {
        if (this.tacBit) {
            this.timaIncrement();
        }
        this._div = 0;
    }

    get tima() {
        return this._tima;
    }

    set tima(value) {
        if (!this.overflow) {
            this._tima = value;
        }
    }

    get tma() {
        return this._tma;
    }

    set tma(value) {
        this._tma = value;
        if (this.overflow) {
            this._tima = this._tma;
        }
    }

    get tac() {
        return 0xf8 | (this.timerEnable << 2) | this.clockSelect;
    }

    set tac(value) {
        const oldBit = this.timerEnable && this.tacBit;
        this.timerEnable = (value & 0x4) != 0;
        this.clockSelect = value & 0x3;
        const newBit = this.timerEnable && this.tacBit;
        if (oldBit && !newBit) {
            this.timaIncrement();
        }
    }

    get tacBit() {
        return (this._div & Timer.tacBits[this.clockSelect]) != 0;
    }

    timaIncrement() {
        this._tima = (this._tima + 1) & 0xff;
        this.overflow = this._tima == 0;
    }

    cycle() {
        if (this.overflow) {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
            this.overflow = false;
            this._tima = this._tma;
            this.gb.requestInterrupt(GameBoy.timerInterrupt);
        } else if (this.timerEnable && this.tacBit) {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
            if (!this.tacBit) {
                this.timaIncrement();
            }
        } else {
            this._div = (this._div + Timer.cyclesPerCPUCycle) & 0xffff;
        }
    }
}
Timer.tacBits = [
    0x200, 0x8, 0x20, 0x80,
];
Timer.frequency = 4194304
Timer.cyclesPerCPUCycle = Timer.frequency / GameBoy.frequency;

        

        class Joypad {
    constructor(gb) {
        this.gb = gb;

        this._p1 = 0;

        this.start = false;
        this.select = false;
        this.b = false;
        this.a = false;

        this.down = false;
        this.up = false;
        this.left = false;
        this.right = false;
    }

    get p1() {
        switch (this._p1) {
            case 0:
                return 0xc0 | (!(this.start || this.down) << 3) | (!(this.select || this.up) << 2) | (!(this.b || this.left) << 1) | !(this.a || this.right);
            case 1:
                return 0xd0 | (!this.start << 3) | (!this.select << 2) | (!this.b << 1) | !this.a;
            case 2:
                return 0xe0 | (!this.down << 3) | (!this.up << 2) | (!this.left << 1) | !this.right;
            case 3:
                return 0xff;
        }
    }

    set p1(value) {
        this._p1 = (value & 0x30) >> 4;
    }
}

        

        class Serial {
    constructor(gb) {
        this.gb = gb;

        this._sb = 0;
        
        this.transferTrigger = false;
        this.transferRunning = false;
        this.useInternalClock = false;
        this.fastClock = false;

        this.cycleCounter = 0;
        this.cycles = 0;
    }

    get sb() {
        return this._sb;
    }

    set sb(value) {
        this._sb = value;
    }

    get sc() {
        return 0x7e | (this.transferRunning << 7) | this.useInternalClock;
    }

    set sc(value) {
        this.transferTrigger = (value & 0x80) != 0;
        if (this.gb.cgb) {
            this.fastClock = (value & 0x2) != 0;
        }
        this.useInternalClock = (value & 0x1) != 0;
    }

    cycle() {
        if (this.transferTrigger) {
            this.transferTrigger = false;
            if (this.useInternalClock) {
                this.cycleCounter = this.fastClock ? Serial.cpuCyclesPerFastCycle : Serial.cpuCyclesPerCycle;
            }
            this.cycles = 0;
            this.transferRunning = true;
        }
        if (this.transferRunning) {
            this.cycleCounter--;
            if (this.cycleCounter == 0) {
                if (this.useInternalClock) {
                    this.cycleCounter = this.fastClock ? Serial.cpuCyclesPerFastCycle : Serial.cpuCyclesPerCycle;
                }
                this._sb = ((this._sb << 1) | 1) & 0xff;
                this.cycles++;
                if (this.cycles == 8) {
                    this.transferRunning = false;
                    this.gb.requestInterrupt(GameBoy.serialInterrupt);
                }
            }
        }
    }
}
Serial.frequency = 8192;
Serial.cpuCyclesPerCycle = GameBoy.frequency / Serial.frequency;
Serial.fastFrequency = 262144;
Serial.cpuCyclesPerFastCycle = GameBoy.frequency / Serial.frequency;

        

        class Cartridge {
    constructor(gb) {
        this.gb = gb;
    }

    readROM(address) {
        switch (this.cartridgeType) {
            case 0x00:
            case 0x08:
            case 0x09:
                return this.rom[address];
            case 0x01:
            case 0x02:
            case 0x03:
            case 0x05:
            case 0x06:
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
            case 0x19:
            case 0x1a:
            case 0x1b:
            case 0x1c:
            case 0x1d:
            case 0x1e:
            case 0xff:
                switch (address >> 14) {
                    case 0:
                        return this.rom[address & 0x3fff];
                    case 1:
                        return this.rom[(this.romBankNumber << 14) | (address & 0x3fff)];
                }
        }
    }

    writeROM(address, value) {
        switch (this.cartridgeType) {
            case 0x00:
            case 0x08:
            case 0x09:
                break;
            case 0x01:
            case 0x02:
            case 0x03:
                switch (address >> 13) {
                    case 0:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 1:
                        this.romBankNumber &= 0x60;
                        if ((value & 0x1f) == 0) {
                            value |= 0x1;
                        }
                        this.romBankNumber |= value & 0x1f;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 2:
                        if (this.ramBankMode) {
                            if (this.hasRAM) {
                                this.ramBankNumber = value & 0x3;
                                this.ramBankNumber %= (this.ram.length / 0x2000);
                            }
                            this.romBankNumber &= 0x1f;
                        } else {
                            this.romBankNumber &= 0x1f;
                            this.romBankNumber |= (value & 0x3) << 5;
                            this.romBankNumber %= (this.rom.length / 0x4000);
                            if (this.hasRAM) {
                                this.ramBankNumber = 0;
                            }
                        }
                        break;
                    case 3:
                        this.ramBankMode = (value & 0x1) != 0;
                        break;
                }
                break;
            case 0x05:
            case 0x06:
                switch ((address >> 8) & 0x41) {
                    case 0:
                        this.ramEnable = (value & 0xf) == 0xa;
                        break;
                    case 1:
                        if ((value & 0xf) == 0) {
                            value |= 0x1;
                        }
                        this.romBankNumber = value & 0xf;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                }
                break;
            case 0x11:
            case 0x12:
            case 0x13:
            case 0x0f:
            case 0x10:
                switch (address >> 13) {
                    case 0:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 1:
                        if ((value & 0x7f) == 0) {
                            value |= 0x1;
                        }
                        this.romBankNumber = value & 0x7f;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 2:
                        switch (value) {
                            case 0x00:
                            case 0x01:
                            case 0x02:
                            case 0x03:
                                if (this.hasRAM) {
                                    this.ramBankNumber = value;
                                    this.ramBankNumber %= (this.ram.length / 0x2000);
                                }
                                break;
                            case 0x08:
                            case 0x09:
                            case 0x0a:
                            case 0x0b:
                            case 0x0c:
                                if (this.hasRTC) {
                                    this.ramBankNumber = value;
                                }
                                break;
                        }
                        break;
                    case 3:
                        if (this.hasRTC) {
                            this.rtc.latch = value;
                        }
                        break;
                }
                break;
            case 0x19:
            case 0x1a:
            case 0x1b:
            case 0x1c:
            case 0x1d:
            case 0x1e:
                switch (address >> 12) {
                    case 0:
                    case 1:
                        if (this.hasRAM) {
                            this.ramEnable = (value & 0xf) == 0xa;
                        }
                        break;
                    case 2:
                        this.romBankNumber &= 0x100;
                        this.romBankNumber |= value;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 3:
                        this.romBankNumber &= 0xff;
                        this.romBankNumber |= (value & 0x1) << 8;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 4:
                    case 5:
                        if (this.hasRAM) {
                            this.ramBankNumber = value & 0xf;
                            this.ramBankNumber %= (this.ram.length / 0x2000);
                        }
                        break;
                }
                break;
            case 0xff:
                switch (address >> 13) {
                    case 0:
                        this.irSelect = value == 0xe;
                        break;
                    case 1:
                        this.romBankNumber = value & 0x3f;
                        this.romBankNumber %= (this.rom.length / 0x4000);
                        break;
                    case 2:
                        this.ramBankNumber = value & 0x3;
                        this.ramBankNumber %= (this.ram.length / 0x2000);
                        break;
                }
                break;
        }
    }

    readRAM(address) {
        if (this.ramEnable) {
            switch (this.cartridgeType) {
                case 0x00:
                    break;
                case 0x08:
                case 0x09:
                    return this.ram[address];
                case 0x01:
                    break;
                case 0x02:
                case 0x03:
                    return this.ram[(this.ramBankNumber << 13) | address];
                case 0x05:
                case 0x06:
                    return 0xf0 | this.ram[address & 0x1ff];
                case 0x11:
                    break;
                case 0x12:
                case 0x13:
                case 0x0f:
                case 0x10:
                    switch (this.ramBankNumber) {
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                            return this.ram[(this.ramBankNumber << 13) | address];
                        case 0x08:
                            return this.rtc.s;
                        case 0x09:
                            return this.rtc.m;
                        case 0x0a:
                            return this.rtc.h;
                        case 0x0b:
                            return this.rtc.dl;
                        case 0x0c:
                            return this.rtc.dh;
                    }
                    break;
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                    return this.ram[(this.ramBankNumber << 13) | address];
                case 0xff:
                    if (this.irSelect) {
                        return this.irOn ? 0xc0 : 0xff;
                    } else {
                        return this.ram[(this.ramBankNumber << 13) | address];
                    }
            }
        }
        return 0xff;
    }

    writeRAM(address, value) {
        if (this.ramEnable) {
            switch (this.cartridgeType) {
                case 0x00:
                    break;
                case 0x08:
                case 0x09:
                    this.ram[address] = value;
                    break;
                case 0x01:
                    break;
                case 0x02:
                case 0x03:
                    this.ram[(this.ramBankNumber << 13) | address] = value;
                    break;
                case 0x05:
                case 0x06:
                    this.ram[address & 0x1ff] = value & 0xf;
                    break;
                case 0x11:
                    break;
                case 0x12:
                case 0x13:
                case 0x0f:
                case 0x10:
                    switch (this.ramBankNumber) {
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                            this.ram[(this.ramBankNumber << 13) | address] = value;
                            break;
                        case 0x08:
                            this.rtc.s = value;
                            break;
                        case 0x09:
                            this.rtc.m = value;
                            break;
                        case 0x0a:
                            this.rtc.h = value;
                            break;
                        case 0x0b:
                            this.rtc.dl = value;
                            break;
                        case 0x0c:
                            this.rtc.dh = value;
                            break;
                    }
                    break;
                case 0x19:
                case 0x1a:
                case 0x1b:
                case 0x1c:
                case 0x1d:
                case 0x1e:
                    this.ram[(this.ramBankNumber << 13) | address] = value;
                    break;
                case 0xff:
                    if (this.irSelect) {
                        this.irOn = (value & 0x1) != 0;
                    } else {
                        this.ram[(this.ramBankNumber << 13) | address] = value;
                    }
                    break;
            }
        }
    }

    load(file) {
        this.title = new TextDecoder('ascii').decode(file.slice(0x134, 0x144));

        const cgb = file[0x143];
        this.gb.cgb = (cgb & 0x80) != 0;
        this.gb.a = cgb ? 0x11 : 0x01;

        this.cartridgeType = file[0x147];
        switch (this.cartridgeType) {
            case 0x09:
                this.hasBattery = true;
            case 0x08:
                this.ramEnable = true;
                this.hasRAM = true;
            case 0x00:
                this.rom = file;
                break;
            case 0x03:
                this.hasBattery = true;
            case 0x02:
                this.ramEnable = false;
                this.ramBankMode = false;
                this.hasRAM = true;
            case 0x01:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            case 0x06:
                this.hasBattery = true;
            case 0x05:
                this.rom = file;
                this.romBankNumber = 1;
                this.ram = new Uint8Array(0x200);
                this.ramEnable = false;
                this.hasRAM = true;
                break;
            case 0x10:
                this.hasRAM = true;
            case 0x0f:
                this.rom = file;
                this.romBankNumber = 1;
                this.ramEnable = false;
                this.hasBattery = true;
                this.hasRTC = true;
                break;
            case 0x13:
                this.hasBattery = true;
            case 0x12:
                this.ramEnable = false;
                this.hasRAM = true;
            case 0x11:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            case 0x1e:
            case 0x1b:
                this.hasBattery = true;
            case 0x1d:
            case 0x1a:
                this.ramEnable = false;
                this.hasRAM = true;
            case 0x1c:
            case 0x19:
                this.rom = file;
                this.romBankNumber = 1;
                break;
            case 0xff:
                this.rom = file;
                this.romBankNumber = 1;
                this.ramEnable = true;
                this.hasRAM = true;
                this.hasBattery = true;
                break;
            default:
                throw 'unknown cartridge type: 0x' + this.cartridgeType.toString(16);
        }

        const romSize = 32768 << file[0x148];
        if (file.length != romSize) {
            throw 'wrong file size';
        }

        const ramSize = file[0x149];
        if (this.hasRAM) {
            if (this.hasBattery && this.title in localStorage) {
                this.ram = new Uint8Array(localStorage[this.title].split(',').map(parseFloat));
            } else {
                switch (ramSize) {
                    case 0x00:
                        break;
                    case 0x02:
                        this.ram = new Uint8Array(0x2000);
                        break;
                    case 0x03:
                        this.ram = new Uint8Array(0x8000);
                        break;
                    case 0x04:
                        this.ram = new Uint8Array(0x20000);
                        break;
                    case 0x05:
                        this.ram = new Uint8Array(0x10000);
                        break;
                    default:
                        throw 'unknown RAM size: 0x' + ramSize.toString(16);
                }
            }
        }
        if (this.hasRTC) {
            if (this.hasBattery && (this.title + 'TIME') in localStorage) {
                this.rtc = new RTC();
                Object.assign(this.rtc, JSON.parse(localStorage[this.title + 'TIME']));
            } else {
                this.rtc = new RTC();
            }
        }
    }

    save() {
        if (this.hasRAM && this.hasBattery) {
            localStorage[this.title] = this.ram;
        }
        if (this.hasRTC && this.hasBattery) {
            localStorage[this.title + 'TIME'] = JSON.stringify(this.rtc);
        }
    }
}

        

        class RTC {
    constructor() {
        this.time = 0;

        this._latch = false;

        this.sec = 0;
        this.min = 0;
        this.hour = 0;
        this.day = 0;
        this.high = 0;

        this.secLatch = 0;
        this.minLatch = 0;
        this.hourLatch = 0;
        this.dayLatch = 0;
        this.highLatch = 0;
    }

    set latch(value) {
        const _latch = (value & 0x1) != 0;
        if (!this._latch && _latch) {
            this.secLatch = this.sec;
            this.minLatch = this.min;
            this.hourLatch = this.hour;
            this.dayLatch = this.day;
            this.highLatch = this.high;
        }
        this._latch = _latch;
    }

    get s() {
        return this.secLatch;
    }

    set s(value) {
        this.sec = value;
    }

    get m() {
        return this.minLatch;
    }

    set m(value) {
        this.min = value;
    }

    get h() {
        return this.hourLatch;
    }

    set h(value) {
        this.hour = value;
    }

    get dl() {
        return this.dayLatch;
    }

    set dl(value) {
        this.day = value;
    }

    get dh() {
        return 0x3e | this.highLatch;
    }

    set dh(value) {
        this.high = value;
    }

    updateTime() {
        if ((this.high & 0x40) == 0) {
            const cur = Math.floor(Date.now() / 1000);
            while (this.time + 60 * 60 * 24 < cur) {
                this.time += 60 * 60 * 24;
                this.day++;
                if (this.day == 256) {
                    this.day = 0;
                    if ((this.high & 0x1) != 0) {
                        this.high |= 0x80;
                    }
                    this.high ^= 0x1;
                }
            }
            while (this.time + 60 * 60 < cur) {
                this.time += 60 * 60;
                this.hour++;
                if (this.hour == 24) {
                    this.hour = 0;
                    this.day++;
                    if (this.day == 256) {
                        this.day = 0;
                        if ((this.high & 0x1) != 0) {
                            this.high |= 0x80;
                        }
                        this.high ^= 0x1;
                    }
                }
            }
            while (this.time + 60 < cur) {
                this.time += 60;
                this.min++;
                if (this.min == 60) {
                    this.min = 0;
                    this.hour++;
                    if (this.hour == 24) {
                        this.hour = 0;
                        this.day++;
                        if (this.day == 256) {
                            this.day = 0;
                            if ((this.high & 0x1) != 0) {
                                this.high |= 0x80;
                            }
                            this.high ^= 0x1;
                        }
                    }
                }
            }
            while (this.time < cur) {
                this.time++;
                this.sec++;
                if (this.sec == 60) {
                    this.sec = 0;
                    this.min++;
                    if (this.min == 60) {
                        this.min = 0;
                        this.hour++;
                        if (this.hour == 24) {
                            this.hour = 0;
                            this.day++;
                            if (this.day == 256) {
                                this.day = 0;
                                if ((this.high & 0x1) != 0) {
                                    this.high |= 0x80;
                                }
                                this.high ^= 0x1;
                            }
                        }
                    }
                }
            }
        }
    }
}

        