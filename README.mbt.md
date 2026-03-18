# trkbt10/ntsc

NTSC/VHS video artifact emulator for [MoonBit](https://moonbitlang.com).

Ported from [zhuker/ntsc](https://github.com/zhuker/ntsc) (Python, Apache-2.0).

## Demo

https://trkbt10.github.io/ntsc_webgl/

## Features

- NTSC composite video signal simulation (chroma subcarrier encode/decode)
- Dot crawl, rainbow effects, color bleeding
- Configurable lowpass filters (I/Q bandwidth limiting)
- Video noise, chroma noise, chroma phase noise
- VHS emulation (tape speed-dependent bandwidth, head switching, edge wave, chroma loss)
- Compiles to WebAssembly (wasm-gc) for real-time browser use

## Install

```bash
moon add trkbt10/ntsc
```

## Usage

```moonbit nocheck
let config = @ntsc.NtscConfig::new()
config.video_noise = 20
config.emulating_vhs = true

let proc = @ntsc.NtscProcessor::new(config)

// Process RGBA frame (320x240)
let rgba_in : FixedArray[Byte] = ...  // input pixels
let rgba_out : FixedArray[Byte] = ... // output pixels
proc.process_frame(rgba_in, 320, 240, rgba_out)
```

## Project Structure

```
src/           Core NTSC processing library (pure MoonBit)
cmd/wasm/      WASM entry point with exported functions
web/           Browser demo (Vite + WebGL + Camera)
```

## WASM Demo

```bash
moon build --target wasm-gc
cd web && npm install && npm run dev
```

## License

Apache-2.0. See [LICENSE](LICENSE).

This project is a port of [zhuker/ntsc](https://github.com/zhuker/ntsc), which is itself
a rewrite of [joncampbell123/composite-video-simulator](https://github.com/joncampbell123/composite-video-simulator).
Both original projects are licensed under Apache-2.0.
