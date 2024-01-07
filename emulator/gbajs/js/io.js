class GameBoyAdvanceIO{constructor(){this.DISPCNT=0,this.GREENSWP=2,this.DISPSTAT=4,this.VCOUNT=6,this.BG0CNT=8,this.BG1CNT=10,this.BG2CNT=12,this.BG3CNT=14,this.BG0HOFS=16,this.BG0VOFS=18,this.BG1HOFS=20,this.BG1VOFS=22,this.BG2HOFS=24,this.BG2VOFS=26,this.BG3HOFS=28,this.BG3VOFS=30,this.BG2PA=32,this.BG2PB=34,this.BG2PC=36,this.BG2PD=38,this.BG2X_LO=40,this.BG2X_HI=42,this.BG2Y_LO=44,this.BG2Y_HI=46,this.BG3PA=48,this.BG3PB=50,this.BG3PC=52,this.BG3PD=54,this.BG3X_LO=56,this.BG3X_HI=58,this.BG3Y_LO=60,this.BG3Y_HI=62,this.WIN0H=64,this.WIN1H=66,this.WIN0V=68,this.WIN1V=70,this.WININ=72,this.WINOUT=74,this.MOSAIC=76,this.BLDCNT=80,this.BLDALPHA=82,this.BLDY=84,this.SOUND1CNT_LO=96,this.SOUND1CNT_HI=98,this.SOUND1CNT_X=100,this.SOUND2CNT_LO=104,this.SOUND2CNT_HI=108,this.SOUND3CNT_LO=112,this.SOUND3CNT_HI=114,this.SOUND3CNT_X=116,this.SOUND4CNT_LO=120,this.SOUND4CNT_HI=124,this.SOUNDCNT_LO=128,this.SOUNDCNT_HI=130,this.SOUNDCNT_X=132,this.SOUNDBIAS=136,this.WAVE_RAM0_LO=144,this.WAVE_RAM0_HI=146,this.WAVE_RAM1_LO=148,this.WAVE_RAM1_HI=150,this.WAVE_RAM2_LO=152,this.WAVE_RAM2_HI=154,this.WAVE_RAM3_LO=156,this.WAVE_RAM3_HI=158,this.FIFO_A_LO=160,this.FIFO_A_HI=162,this.FIFO_B_LO=164,this.FIFO_B_HI=166,this.DMA0SAD_LO=176,this.DMA0SAD_HI=178,this.DMA0DAD_LO=180,this.DMA0DAD_HI=182,this.DMA0CNT_LO=184,this.DMA0CNT_HI=186,this.DMA1SAD_LO=188,this.DMA1SAD_HI=190,this.DMA1DAD_LO=192,this.DMA1DAD_HI=194,this.DMA1CNT_LO=196,this.DMA1CNT_HI=198,this.DMA2SAD_LO=200,this.DMA2SAD_HI=202,this.DMA2DAD_LO=204,this.DMA2DAD_HI=206,this.DMA2CNT_LO=208,this.DMA2CNT_HI=210,this.DMA3SAD_LO=212,this.DMA3SAD_HI=214,this.DMA3DAD_LO=216,this.DMA3DAD_HI=218,this.DMA3CNT_LO=220,this.DMA3CNT_HI=222,this.TM0CNT_LO=256,this.TM0CNT_HI=258,this.TM1CNT_LO=260,this.TM1CNT_HI=262,this.TM2CNT_LO=264,this.TM2CNT_HI=266,this.TM3CNT_LO=268,this.TM3CNT_HI=270,this.SIODATA32_LO=288,this.SIOMULTI0=288,this.SIODATA32_HI=290,this.SIOMULTI1=290,this.SIOMULTI2=292,this.SIOMULTI3=294,this.SIOCNT=296,this.SIOMLT_SEND=298,this.SIODATA8=298,this.RCNT=308,this.JOYCNT=320,this.JOY_RECV=336,this.JOY_TRANS=340,this.JOYSTAT=344,this.KEYINPUT=304,this.KEYCNT=306,this.IE=512,this.IF=514,this.WAITCNT=516,this.IME=520,this.POSTFLG=768,this.HALTCNT=769,this.DEFAULT_DISPCNT=128,this.DEFAULT_SOUNDBIAS=512,this.DEFAULT_BGPA=1,this.DEFAULT_BGPD=1,this.DEFAULT_RCNT=32768}clear(){this.registers=new Uint16Array(this.cpu.mmu.SIZE_IO),this.registers[this.DISPCNT>>1]=this.DEFAULT_DISPCNT,this.registers[this.SOUNDBIAS>>1]=this.DEFAULT_SOUNDBIAS,this.registers[this.BG2PA>>1]=this.DEFAULT_BGPA,this.registers[this.BG2PD>>1]=this.DEFAULT_BGPD,this.registers[this.BG3PA>>1]=this.DEFAULT_BGPA,this.registers[this.BG3PD>>1]=this.DEFAULT_BGPD,this.registers[this.RCNT>>1]=this.DEFAULT_RCNT}freeze(){return{registers:Serializer.prefix(this.registers.buffer)}}defrost(b){this.registers=new Uint16Array(b.registers);for(var a=0;a<=this.BLDY;a+=2)this.store16(a,this.registers[a>>1])}load8(a){throw'Unimplmeneted unaligned I/O access'}load16(a){return this.loadU16(a)<<16>>16}load32(a){switch(a&=4294967292,a){case this.DMA0CNT_LO:case this.DMA1CNT_LO:case this.DMA2CNT_LO:case this.DMA3CNT_LO:return this.loadU16(a|2)<<16;case this.IME:return this.loadU16(a)&65535;case this.JOY_RECV:case this.JOY_TRANS:return this.core.STUB('Unimplemented JOY register read: 0x'+a.toString(16)),0}return this.loadU16(a)|this.loadU16(a|2)<<16}loadU8(a){var b=a&1,c=this.loadU16(a&65534);return c>>>(b<<3)&255}loadU16(a){switch(a){case this.DISPCNT:case this.BG0CNT:case this.BG1CNT:case this.BG2CNT:case this.BG3CNT:case this.WININ:case this.WINOUT:case this.SOUND1CNT_LO:case this.SOUND3CNT_LO:case this.SOUNDCNT_LO:case this.SOUNDCNT_HI:case this.SOUNDBIAS:case this.BLDCNT:case this.BLDALPHA:case this.TM0CNT_HI:case this.TM1CNT_HI:case this.TM2CNT_HI:case this.TM3CNT_HI:case this.DMA0CNT_HI:case this.DMA1CNT_HI:case this.DMA2CNT_HI:case this.DMA3CNT_HI:case this.RCNT:case this.WAITCNT:case this.IE:case this.IF:case this.IME:case this.POSTFLG:break;case this.DISPSTAT:return this.registers[a>>1]|this.video.readDisplayStat();case this.VCOUNT:return this.video.vcount;case this.SOUND1CNT_HI:case this.SOUND2CNT_LO:return this.registers[a>>1]&65472;case this.SOUND1CNT_X:case this.SOUND2CNT_HI:case this.SOUND3CNT_X:return this.registers[a>>1]&16384;case this.SOUND3CNT_HI:return this.registers[a>>1]&57344;case this.SOUND4CNT_LO:return this.registers[a>>1]&65280;case this.SOUND4CNT_HI:return this.registers[a>>1]&16639;case this.SOUNDCNT_X:return this.core.STUB('Unimplemented sound register read: SOUNDCNT_X'),this.registers[a>>1]|0;case this.TM0CNT_LO:return this.cpu.irq.timerRead(0);case this.TM1CNT_LO:return this.cpu.irq.timerRead(1);case this.TM2CNT_LO:return this.cpu.irq.timerRead(2);case this.TM3CNT_LO:return this.cpu.irq.timerRead(3);case this.SIOCNT:return this.sio.readSIOCNT();case this.KEYINPUT:return this.keypad.pollGamepads(),this.keypad.currentDown;case this.KEYCNT:return this.core.STUB('Unimplemented I/O register read: KEYCNT'),0;case this.BG0HOFS:case this.BG0VOFS:case this.BG1HOFS:case this.BG1VOFS:case this.BG2HOFS:case this.BG2VOFS:case this.BG3HOFS:case this.BG3VOFS:case this.BG2PA:case this.BG2PB:case this.BG2PC:case this.BG2PD:case this.BG3PA:case this.BG3PB:case this.BG3PC:case this.BG3PD:case this.BG2X_LO:case this.BG2X_HI:case this.BG2Y_LO:case this.BG2Y_HI:case this.BG3X_LO:case this.BG3X_HI:case this.BG3Y_LO:case this.BG3Y_HI:case this.WIN0H:case this.WIN1H:case this.WIN0V:case this.WIN1V:case this.BLDY:case this.DMA0SAD_LO:case this.DMA0SAD_HI:case this.DMA0DAD_LO:case this.DMA0DAD_HI:case this.DMA0CNT_LO:case this.DMA1SAD_LO:case this.DMA1SAD_HI:case this.DMA1DAD_LO:case this.DMA1DAD_HI:case this.DMA1CNT_LO:case this.DMA2SAD_LO:case this.DMA2SAD_HI:case this.DMA2DAD_LO:case this.DMA2DAD_HI:case this.DMA2CNT_LO:case this.DMA3SAD_LO:case this.DMA3SAD_HI:case this.DMA3DAD_LO:case this.DMA3DAD_HI:case this.DMA3CNT_LO:case this.FIFO_A_LO:case this.FIFO_A_HI:case this.FIFO_B_LO:case this.FIFO_B_HI:return this.core.WARN('Read for write-only register: 0x'+a.toString(16)),this.core.mmu.badMemory.loadU16(0);case this.MOSAIC:return this.core.WARN('Read for write-only register: 0x'+a.toString(16)),0;case this.SIOMULTI0:case this.SIOMULTI1:case this.SIOMULTI2:case this.SIOMULTI3:return this.sio.read(a-this.SIOMULTI0>>1);case this.SIODATA8:return this.core.STUB('Unimplemented SIO register read: 0x'+a.toString(16)),0;case this.JOYCNT:case this.JOYSTAT:return this.core.STUB('Unimplemented JOY register read: 0x'+a.toString(16)),0;default:return this.core.WARN('Bad I/O register read: 0x'+a.toString(16)),this.core.mmu.badMemory.loadU16(0)}return this.registers[a>>1]}store8(a,b){switch(a){case this.WININ:this.value&63;break;case this.WININ|1:this.value&63;break;case this.WINOUT:this.value&63;break;case this.WINOUT|1:this.value&63;break;case this.SOUND1CNT_LO:case this.SOUND1CNT_LO|1:case this.SOUND1CNT_HI:case this.SOUND1CNT_HI|1:case this.SOUND1CNT_X:case this.SOUND1CNT_X|1:case this.SOUND2CNT_LO:case this.SOUND2CNT_LO|1:case this.SOUND2CNT_HI:case this.SOUND2CNT_HI|1:case this.SOUND3CNT_LO:case this.SOUND3CNT_LO|1:case this.SOUND3CNT_HI:case this.SOUND3CNT_HI|1:case this.SOUND3CNT_X:case this.SOUND3CNT_X|1:case this.SOUND4CNT_LO:case this.SOUND4CNT_LO|1:case this.SOUND4CNT_HI:case this.SOUND4CNT_HI|1:case this.SOUNDCNT_LO:case this.SOUNDCNT_LO|1:case this.SOUNDCNT_X:case this.IF:case this.IME:break;case this.SOUNDBIAS|1:this.STUB_REG('sound',a);break;case this.HALTCNT:b&=128,b?this.core.STUB('Stop'):this.core.irq.halt();return;default:this.STUB_REG('8-bit I/O',a);break}a&1?(b<<=8,b|=this.registers[a>>1]&255):(b&=255,b|=this.registers[a>>1]&65280),this.store16(a&268435454,b)}store16(b,a){switch(b){case this.DISPCNT:this.video.renderPath.writeDisplayControl(a);break;case this.DISPSTAT:a&=this.video.DISPSTAT_MASK,this.video.writeDisplayStat(a);break;case this.BG0CNT:this.video.renderPath.writeBackgroundControl(0,a);break;case this.BG1CNT:this.video.renderPath.writeBackgroundControl(1,a);break;case this.BG2CNT:this.video.renderPath.writeBackgroundControl(2,a);break;case this.BG3CNT:this.video.renderPath.writeBackgroundControl(3,a);break;case this.BG0HOFS:this.video.renderPath.writeBackgroundHOffset(0,a);break;case this.BG0VOFS:this.video.renderPath.writeBackgroundVOffset(0,a);break;case this.BG1HOFS:this.video.renderPath.writeBackgroundHOffset(1,a);break;case this.BG1VOFS:this.video.renderPath.writeBackgroundVOffset(1,a);break;case this.BG2HOFS:this.video.renderPath.writeBackgroundHOffset(2,a);break;case this.BG2VOFS:this.video.renderPath.writeBackgroundVOffset(2,a);break;case this.BG3HOFS:this.video.renderPath.writeBackgroundHOffset(3,a);break;case this.BG3VOFS:this.video.renderPath.writeBackgroundVOffset(3,a);break;case this.BG2X_LO:this.video.renderPath.writeBackgroundRefX(2,this.registers[b>>1|1]<<16|a);break;case this.BG2X_HI:this.video.renderPath.writeBackgroundRefX(2,this.registers[b>>1^1]|a<<16);break;case this.BG2Y_LO:this.video.renderPath.writeBackgroundRefY(2,this.registers[b>>1|1]<<16|a);break;case this.BG2Y_HI:this.video.renderPath.writeBackgroundRefY(2,this.registers[b>>1^1]|a<<16);break;case this.BG2PA:this.video.renderPath.writeBackgroundParamA(2,a);break;case this.BG2PB:this.video.renderPath.writeBackgroundParamB(2,a);break;case this.BG2PC:this.video.renderPath.writeBackgroundParamC(2,a);break;case this.BG2PD:this.video.renderPath.writeBackgroundParamD(2,a);break;case this.BG3X_LO:this.video.renderPath.writeBackgroundRefX(3,this.registers[b>>1|1]<<16|a);break;case this.BG3X_HI:this.video.renderPath.writeBackgroundRefX(3,this.registers[b>>1^1]|a<<16);break;case this.BG3Y_LO:this.video.renderPath.writeBackgroundRefY(3,this.registers[b>>1|1]<<16|a);break;case this.BG3Y_HI:this.video.renderPath.writeBackgroundRefY(3,this.registers[b>>1^1]|a<<16);break;case this.BG3PA:this.video.renderPath.writeBackgroundParamA(3,a);break;case this.BG3PB:this.video.renderPath.writeBackgroundParamB(3,a);break;case this.BG3PC:this.video.renderPath.writeBackgroundParamC(3,a);break;case this.BG3PD:this.video.renderPath.writeBackgroundParamD(3,a);break;case this.WIN0H:this.video.renderPath.writeWin0H(a);break;case this.WIN1H:this.video.renderPath.writeWin1H(a);break;case this.WIN0V:this.video.renderPath.writeWin0V(a);break;case this.WIN1V:this.video.renderPath.writeWin1V(a);break;case this.WININ:a&=16191,this.video.renderPath.writeWinIn(a);break;case this.WINOUT:a&=16191,this.video.renderPath.writeWinOut(a);break;case this.BLDCNT:a&=32767,this.video.renderPath.writeBlendControl(a);break;case this.BLDALPHA:a&=7967,this.video.renderPath.writeBlendAlpha(a);break;case this.BLDY:a&=31,this.video.renderPath.writeBlendY(a);break;case this.MOSAIC:this.video.renderPath.writeMosaic(a);break;case this.SOUND1CNT_LO:a&=127,this.audio.writeSquareChannelSweep(0,a);break;case this.SOUND1CNT_HI:this.audio.writeSquareChannelDLE(0,a);break;case this.SOUND1CNT_X:a&=51199,this.audio.writeSquareChannelFC(0,a),a&=~32768;break;case this.SOUND2CNT_LO:this.audio.writeSquareChannelDLE(1,a);break;case this.SOUND2CNT_HI:a&=51199,this.audio.writeSquareChannelFC(1,a),a&=~32768;break;case this.SOUND3CNT_LO:a&=224,this.audio.writeChannel3Lo(a);break;case this.SOUND3CNT_HI:a&=57599,this.audio.writeChannel3Hi(a);break;case this.SOUND3CNT_X:a&=51199,this.audio.writeChannel3X(a),a&=~32768;break;case this.SOUND4CNT_LO:a&=65343,this.audio.writeChannel4LE(a);break;case this.SOUND4CNT_HI:a&=49407,this.audio.writeChannel4FC(a),a&=~32768;break;case this.SOUNDCNT_LO:a&=65399,this.audio.writeSoundControlLo(a);break;case this.SOUNDCNT_HI:a&=65295,this.audio.writeSoundControlHi(a);break;case this.SOUNDCNT_X:a&=128,this.audio.writeEnable(a);break;case this.WAVE_RAM0_LO:case this.WAVE_RAM0_HI:case this.WAVE_RAM1_LO:case this.WAVE_RAM1_HI:case this.WAVE_RAM2_LO:case this.WAVE_RAM2_HI:case this.WAVE_RAM3_LO:case this.WAVE_RAM3_HI:this.audio.writeWaveData(b-this.WAVE_RAM0_LO,a,2);break;case this.DMA0SAD_LO:case this.DMA0DAD_LO:case this.DMA1SAD_LO:case this.DMA1DAD_LO:case this.DMA2SAD_LO:case this.DMA2DAD_LO:case this.DMA3SAD_LO:case this.DMA3DAD_LO:this.store32(b,this.registers[(b>>1)+1]<<16|a);return;case this.DMA0SAD_HI:case this.DMA0DAD_HI:case this.DMA1SAD_HI:case this.DMA1DAD_HI:case this.DMA2SAD_HI:case this.DMA2DAD_HI:case this.DMA3SAD_HI:case this.DMA3DAD_HI:this.store32(b-2,this.registers[(b>>1)-1]|a<<16);return;case this.DMA0CNT_LO:this.cpu.irq.dmaSetWordCount(0,a);break;case this.DMA0CNT_HI:this.registers[b>>1]=a&65504,this.cpu.irq.dmaWriteControl(0,a);return;case this.DMA1CNT_LO:this.cpu.irq.dmaSetWordCount(1,a);break;case this.DMA1CNT_HI:this.registers[b>>1]=a&65504,this.cpu.irq.dmaWriteControl(1,a);return;case this.DMA2CNT_LO:this.cpu.irq.dmaSetWordCount(2,a);break;case this.DMA2CNT_HI:this.registers[b>>1]=a&65504,this.cpu.irq.dmaWriteControl(2,a);return;case this.DMA3CNT_LO:this.cpu.irq.dmaSetWordCount(3,a);break;case this.DMA3CNT_HI:this.registers[b>>1]=a&65504,this.cpu.irq.dmaWriteControl(3,a);return;case this.TM0CNT_LO:this.cpu.irq.timerSetReload(0,a);return;case this.TM1CNT_LO:this.cpu.irq.timerSetReload(1,a);return;case this.TM2CNT_LO:this.cpu.irq.timerSetReload(2,a);return;case this.TM3CNT_LO:this.cpu.irq.timerSetReload(3,a);return;case this.TM0CNT_HI:a&=199,this.cpu.irq.timerWriteControl(0,a);break;case this.TM1CNT_HI:a&=199,this.cpu.irq.timerWriteControl(1,a);break;case this.TM2CNT_HI:a&=199,this.cpu.irq.timerWriteControl(2,a);break;case this.TM3CNT_HI:a&=199,this.cpu.irq.timerWriteControl(3,a);break;case this.SIOMULTI0:case this.SIOMULTI1:case this.SIOMULTI2:case this.SIOMULTI3:case this.SIODATA8:this.STUB_REG('SIO',b);break;case this.RCNT:this.sio.setMode(a>>12&12|this.registers[this.SIOCNT>>1]>>12&3),this.sio.writeRCNT(a);break;case this.SIOCNT:this.sio.setMode(a>>12&3|this.registers[this.RCNT>>1]>>12&12),this.sio.writeSIOCNT(a);return;case this.JOYCNT:case this.JOYSTAT:this.STUB_REG('JOY',b);break;case this.IE:a&=16383,this.cpu.irq.setInterruptsEnabled(a);break;case this.IF:this.cpu.irq.dismissIRQs(a);return;case this.WAITCNT:a&=57343,this.cpu.mmu.adjustTimings(a);break;case this.IME:a&=1,this.cpu.irq.masterEnable(a);break;default:this.STUB_REG('I/O',b)}this.registers[b>>1]=a}store32(b,a){switch(b){case this.BG2X_LO:a&=268435455,this.video.renderPath.writeBackgroundRefX(2,a);break;case this.BG2Y_LO:a&=268435455,this.video.renderPath.writeBackgroundRefY(2,a);break;case this.BG3X_LO:a&=268435455,this.video.renderPath.writeBackgroundRefX(3,a);break;case this.BG3Y_LO:a&=268435455,this.video.renderPath.writeBackgroundRefY(3,a);break;case this.DMA0SAD_LO:this.cpu.irq.dmaSetSourceAddress(0,a);break;case this.DMA0DAD_LO:this.cpu.irq.dmaSetDestAddress(0,a);break;case this.DMA1SAD_LO:this.cpu.irq.dmaSetSourceAddress(1,a);break;case this.DMA1DAD_LO:this.cpu.irq.dmaSetDestAddress(1,a);break;case this.DMA2SAD_LO:this.cpu.irq.dmaSetSourceAddress(2,a);break;case this.DMA2DAD_LO:this.cpu.irq.dmaSetDestAddress(2,a);break;case this.DMA3SAD_LO:this.cpu.irq.dmaSetSourceAddress(3,a);break;case this.DMA3DAD_LO:this.cpu.irq.dmaSetDestAddress(3,a);break;case this.FIFO_A_LO:this.audio.appendToFifoA(a);return;case this.FIFO_B_LO:this.audio.appendToFifoB(a);return;case this.IME:this.store16(b,a&65535);return;case this.JOY_RECV:case this.JOY_TRANS:this.STUB_REG('JOY',b);return;default:this.store16(b,a&65535),this.store16(b|2,a>>>16);return}this.registers[b>>1]=a&65535,this.registers[(b>>1)+1]=a>>>16}invalidatePage(a){}STUB_REG(a,b){this.core.STUB('Unimplemented '+a+' register write: '+b.toString(16))}}