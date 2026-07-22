# Awesome NPU [![Awesome](https://awesome.re/badge.svg)](https://awesome.re)

Commercial NPUs and AI inference accelerators, from MCU-class parts to datacenter cards.

Data is compiled from vendor pages and public reporting (2025–2026) and may lag product revisions. Compute figures are vendor-stated peak TOPS at INT8 unless noted; datacenter parts often publish throughput/memory specs instead of a single TOPS number, shown as `-`. Prices are listed only where officially disclosed. Sorted by compute, ascending.

`⚠` marks parts that are not standalone products — SoC-integrated or IP that must be built into a host system.

The **Memory** column shows dedicated on-board/on-chip memory where a part carries its own; `shared (host)` or `unified` means it uses the host system's RAM instead. This matters for LLM/VLM work, where model size is bound by available memory.

Flags: 🇰🇷 Korea, 🇺🇸 USA, 🇳🇱 Netherlands, 🇨🇳 China, 🇳🇴 Norway, 🇮🇱 Israel, 🇩🇪 Germany, 🇫🇷 France, 🇯🇵 Japan.

## Contents

- [Products](#products)
- [Datacenter inference accelerators](#datacenter-inference-accelerators)
- [Raspberry Pi accelerators](#raspberry-pi-accelerators)
  - [Pi 5 (M.2 HAT+)](#pi-5-m2-hat)
  - [Pi 4 / Pi 3 and older (USB)](#pi-4--pi-3-and-older-usb)
  - [Notes on Pi compatibility](#notes-on-pi-compatibility)
- [Software](#software)
  - [Vendor SDKs & toolchains](#vendor-sdks--toolchains)
  - [Compilers & IR](#compilers--ir)
  - [Runtimes & inference engines](#runtimes--inference-engines)
  - [LLM on edge](#llm-on-edge)
  - [Model optimization (quantization / pruning)](#model-optimization-quantization--pruning)
  - [Benchmarks](#benchmarks)
  - [Model zoos](#model-zoos)
- [Learning resources](#learning-resources)
- [Glossary](#glossary)
- [Contributing](#contributing)

## Products

| Vendor | Product | Country | Form Factor | Compute (TOPS) | Memory | Use Case | Released | Price |
|--------|---------|:---:|-------------|:---:|--------|----------|:---:|-------|
| Syntiant | [NDP120](https://www.syntiant.com/hardware) ⚠ | 🇺🇸 | SoC | - | on-chip | Always-on audio / sensor | 2021-09 | - |
| BrainChip | [Akida (AKD1000)](https://brainchip.com/akida-generations/) ⚠ | 🇺🇸 | M.2 / PCIe | - | on-chip SRAM | Neuromorphic event-based | 2021-01 | - |
| Rebellions | [ION](https://rebellions.ai/) | 🇰🇷 | PCIe | - | on-card | Finance inference | 2021-11 | - |
| Rebellions | [ATOM](https://rebellions.ai/rebellions-product/atom/) | 🇰🇷 | PCIe | - | GDDR6 (on-card) | Datacenter inference | 2023-02 | - |
| Rebellions | [ATOM Max](https://rebellions.ai/rebellions-product/atom-max/) | 🇰🇷 | PCIe | - | on-card | Datacenter inference | 2023-12 | - |
| Rebellions | [REBEL / Rebel 100](https://rebellions.ai/rebellions-product/rebel/) | 🇰🇷 | Server/Rack | - | HBM3E (on-package) | LLM & multimodal | 2025-08 | - |
| FuriosaAI | [WARBOY](https://www.furiosa.ai/warboy) | 🇰🇷 | PCIe | - | on-card | Vision inference | 2021-06 | - |
| FuriosaAI | [RNGD](https://www.furiosa.ai/rngd) | 🇰🇷 | PCIe | - | HBM3 (48 GB) | LLM inference | 2024-08 | - |
| DEEPX | [DX-H1](https://deepx.ai/products/dx-h1-v-npu/) | 🇰🇷 | Server/Rack | - | on-card | Multi-camera inference server | - | - |
| DEEPX | [DX-M2](https://deepx.ai/) | 🇰🇷 | M.2 | - | on-module | Robotics / physical AI | - | - |
| HyperAccel | [Orion](https://hyperaccel.ai/) | 🇰🇷 | Server/Rack | - | HBM / LPDDR | LLM inference (FPGA) | 2023-11 | - |
| HyperAccel | [Bertha](https://hyperaccel.ai/) | 🇰🇷 | PCIe | - | LPDDR5X (on-card) | LLM inference (ASIC) | 2026-01 | ~₩5M (target) |
| Telechips | [N-Dolphin](https://www.telechips.com/) ⚠ | 🇰🇷 | SoC | - | shared (host) | Automotive vision (ADAS) | 2023-12 | - |
| Apple | [Neural Engine (A / M series)](https://www.apple.com/) ⚠ | 🇺🇸 | SoC | - | unified (shared) | Mobile / desktop on-device | 2017-09 | - |
| MediaTek | [APU (NeuroPilot / Dimensity)](https://www.mediatek.com/) ⚠ | 🇯🇵 | SoC | - | shared (host) | Mobile on-device | 2018-01 | - |
| Ambarella | [CV72S](https://www.ambarella.com/) ⚠ | 🇺🇸 | SoC | - | shared (host) | Camera / edge vision | 2023-01 | - |
| NXP | [Ara-1 DNPU](https://www.nxp.com/products/processors-and-microcontrollers/arm-processors/discrete-neural-processing-units:DNPU) | 🇳🇱 | M.2 | - | on-module | Camera / edge server | 2025-04 | - |
| Nordic Semiconductor | [Axon NPU (nRF54LM20B)](https://www.nordicsemi.com/Products/Technologies/Edge-AI/Axon-NPU) ⚠ | 🇳🇴 | SoC | - | 512 KB RAM / 2 MB NVM | MCU-class TinyML | 2026-04 | - |
| Qualcomm | [Hexagon NPU](https://www.qualcomm.com/products/technology/processors/hexagon) ⚠ | 🇺🇸 | SoC | - | shared (host) | Mobile / on-device | - | - |
| Intel | [Movidius NCS (1st gen)](https://www.intel.com/content/www/us/en/developer/tools/neural-compute-stick/overview.html) | 🇺🇸 | USB | - | on-stick | Prototyping (Myriad 2) | 2017-07 | EOL |
| NXP | [i.MX 8M Plus NPU](https://www.nxp.com/products/i.MX8MPLUS) ⚠ | 🇳🇱 | SoC | 2.3 | shared (host) | Industrial IoT | 2021-01 | - |
| Rockchip | [RK1808](https://t.rock-chips.com/en/) ⚠ | 🇨🇳 | SoC / USB | 3 | shared (host) | Early edge NPU stick | 2019-01 | - |
| Google | [Coral USB Accelerator](https://coral.ai/products/accelerator/) | 🇺🇸 | USB | 4 | 8 MB SRAM (on-chip) | Edge (TFLite) | 2019-03 | $59.99 |
| Google | [Coral M.2 / Mini PCIe (single)](https://coral.ai/products/m2-accelerator-ae/) | 🇺🇸 | M.2 / mPCIe | 4 | 8 MB SRAM (on-chip) | Edge (TFLite) | 2019-11 | $24.99 |
| Intel | [Neural Compute Stick 2](https://www.intel.com/content/www/us/en/developer/tools/neural-compute-stick/overview.html) | 🇺🇸 | USB | 4 | on-stick | Prototyping (OpenVINO) | 2018-11 | ~$70 (EOL) |
| MemryX | [MX3](https://memryx.com/products/) | 🇺🇸 | M.2 | 5 (TFLOPS) | on-chip SRAM | Vision / CNN | 2024-06 | ~$149 |
| Rockchip | [RK3588 NPU](https://www.rock-chips.com/a/en/products/RK35_Series/2022/0926/1660.html) ⚠ | 🇨🇳 | SoC | 6 | shared (host) | General edge (SBC) | 2022-01 | $100+ (board) |
| Rockchip | [RK3576 NPU](https://www.rock-chips.com/) ⚠ | 🇨🇳 | SoC | 6 | shared (host) | Mid-range edge (SBC) | 2024-05 | board |
| DEEPX | [DX-L1 / DX-L2](https://deepx.ai/) ⚠ | 🇰🇷 | SoC | 6.4 | shared (host) | Smart appliances / sensors | - | - |
| Google | [Coral M.2 Dual Edge TPU](https://coral.ai/products/m2-accelerator-dual-edgetpu/) | 🇺🇸 | M.2 | 8 | 8 MB SRAM x2 | Edge (TFLite) | 2020-01 | $39.99 |
| Kneron | [KL530](https://www.kneron.com/en/product/ai_solution/) ⚠ | 🇺🇸 | SoC | 8 | on-chip | Entry on-device vision | 2022-05 | - |
| Mobilint | [REGULUS](https://www.mobilint.com/regulus) ⚠ | 🇰🇷 | SoC | 10 | ~8 GB LPDDR4X | Drones / AI cameras | 2025-01 | - |
| Hailo | [Hailo-8L M.2](https://hailo.ai/products/ai-accelerators/hailo-8l-entry-level-ai-acceleration-module/) | 🇮🇱 | M.2 | 13 | on-chip | Entry edge vision (Pi AI Kit) | 2024-06 | ~$70 |
| Blaize | [1600 SoC](https://www.blaize.com/products/) | 🇺🇸 | SoC / PCIe | 16 | up to 4 GB LPDDR4 | Edge vision / gateway | 2023-01 | - |
| Huawei | [Ascend 310 (Atlas 200)](https://www.hiascend.com/) ⚠ | 🇨🇳 | SoC / module | 16 | LPDDR4X (on-module) | Edge inference | 2018-10 | - |
| Kneron | [KL730](https://www.kneron.com/en/product/ai_solution/) ⚠ | 🇺🇸 | SoC | 25 | on-chip | On-device vision | 2023-08 | - |
| DEEPX | [DX-M1](https://deepx.ai/products/dx-m1/) | 🇰🇷 | M.2 | 25 | 4 GB LPDDR5 (on-card) | Edge (industrial, RPi5) | 2025-09 | ~$100s |
| DEEPX | [DX-M1M](https://deepx.ai/products/dx-m1m/) | 🇰🇷 | M.2 | 25 | on-module | On-device (low power) | 2025-12 | - |
| Hailo | [Hailo-8 M.2](https://hailo.ai/products/ai-accelerators/hailo-8-m2-ai-acceleration-module/) | 🇮🇱 | M.2 | 26 | on-chip | Edge vision (RPi5) | 2021-01 | $120–150 |
| Rockchip | [RK1820](https://www.rock-chips.com/) ⚠ | 🇨🇳 | SoC | 30 | stacked DRAM | Local LLM / vision | 2025-11 | - |
| NXP | [Ara240 DNPU](https://www.nxp.com/products/processors-and-microcontrollers/arm-processors/discrete-neural-processing-units:DNPU) | 🇳🇱 | M.2 | 40 | 16 GB (on-module) | GenAI / LLM & VLM | 2026-06 | - |
| Hailo | [Hailo-10H M.2](https://hailo.ai/products/ai-accelerators/hailo-10h-m2-generative-ai-acceleration-module/) | 🇮🇱 | M.2 | 40 | LPDDR4 (on-module) | Generative AI on edge | 2025-01 | - |
| SiMa.ai | [MLSoC](https://sima.ai/products/) | 🇺🇸 | M.2 / module | 50 | LPDDR4 (on-module) | Automotive / robotics | 2023-05 | - |
| Mobilint | [MLA100 PCIe Card](https://www.mobilint.com/aries/mla100) | 🇰🇷 | PCIe | 80 | 16 / 32 GB LPDDR4X | Edge / AI workstation | 2024-01 | - |
| Mobilint | [MLA100 MXM](https://www.mobilint.com/aries) | 🇰🇷 | MXM | 80 | LPDDR4X (on-module) | Embedded robotics | 2025-04 | - |
| Mobilint | [MLX-A1 Edge AI Box](https://www.mobilint.com/aries/mlx-a1) | 🇰🇷 | Box | 80 | LPDDR4X (on-board) | All-in-one edge box | 2025-06 | - |
| Qualcomm | [Snapdragon X2 Elite NPU](https://www.qualcomm.com/products/mobile/snapdragon/pcs-and-tablets) ⚠ | 🇺🇸 | SoC | 80 | unified LPDDR5x | PC / on-device | 2025-09 | - |
| Axelera AI | [Metis M.2](https://axelera.ai/ai-accelerators) | 🇳🇱 | M.2 | 214 | 1 GB (on-card) | Vision / local LLM | 2023-11 | ~$199 |
| Mobilint | [MLA400 PCIe Card](https://www.mobilint.com/aries/mla400) | 🇰🇷 | PCIe | ~320 | LPDDR4X (on-card) | On-prem multi-LLM / vision | 2026-01 | - |
| Axelera AI | [Europa](https://axelera.ai/) | 🇳🇱 | PCIe | 629 | on-card | Datacenter-class edge | 2026 | - |
| Axelera AI | [Metis PCIe (4-core)](https://axelera.ai/ai-accelerators) | 🇳🇱 | PCIe | 856 | up to 8 GB (on-card) | Multi-stream edge server | 2026-01 | - |

## Datacenter inference accelerators

Larger AI accelerators aimed at server/datacenter inference rather than embedded edge. Listed separately because they are cards/systems, not on-device parts. Compute here is peak FP8/FP16 (TFLOPS) where TOPS isn't the vendor's headline number.

| Vendor | Product | Country | Form Factor | Compute | Memory | Released | Price |
|--------|---------|:---:|-------------|---------|--------|:---:|-------|
| Tenstorrent | [Wormhole n150s](https://tenstorrent.com/hardware/wormhole) | 🇺🇸 | PCIe | 262 TFLOPS FP8 | 12 GB GDDR6 | 2024-07 | $999 |
| Tenstorrent | [Wormhole n300s](https://tenstorrent.com/hardware/wormhole) | 🇺🇸 | PCIe | 524 TFLOPS FP8 | 24 GB GDDR6 | 2024-07 | $1,399 |
| Tenstorrent | [Blackhole p100a](https://tenstorrent.com/hardware/blackhole) | 🇺🇸 | PCIe | ~670 TFLOPS FP8 | 28 GB GDDR6 | 2025-04 | $999 |
| Tenstorrent | [Blackhole p150a](https://tenstorrent.com/hardware/blackhole) | 🇺🇸 | PCIe | 745 TFLOPS FP8 | 32 GB GDDR6 | 2025-04 | $1,399 |
| Graphcore | [Bow IPU (Bow-2000)](https://www.graphcore.ai/products/ipu) | 🇺🇸 | Blade / system | 350 TFLOPS FP16 | 900 MB SRAM | 2022-03 | - |
| SambaNova | [SN40L](https://sambanova.ai/technology/sn40l-rdu) | 🇺🇸 | System (RDU) | - | HBM3 + DDR | 2023-09 | - |
| Cerebras | [WSE-3 (CS-3)](https://www.cerebras.ai/product-chip) | 🇺🇸 | Wafer-scale system | - | 44 GB on-chip | 2024-03 | - |
| Groq | [LPU (GroqCard)](https://groq.com/) | 🇺🇸 | PCIe | - | 230 MB SRAM | 2023-01 | - |
| d-Matrix | [Corsair](https://www.d-matrix.ai/product/) | 🇺🇸 | PCIe | - | digital in-memory | 2025-01 | - |
| Untether AI | [speedAI240](https://www.untether.ai/) | 🇺🇸 | PCIe | - | at-memory compute | 2024-01 | - |
| Etched | [Sohu](https://www.etched.com/) | 🇺🇸 | System | - | transformer-only ASIC | 2025 | - |
| Huawei | [Ascend 910C](https://www.hiascend.com/) | 🇨🇳 | System (OAM) | - | HBM | 2025-01 | - |
| Cambricon | [Siyuan 590](https://www.cambricon.com/) | 🇨🇳 | PCIe / system | - | HBM | 2023-01 | - |

## Raspberry Pi accelerators

Which accelerator fits depends on the Pi generation. Pi 5 exposes a PCIe lane (via M.2 HAT+), so it takes M.2 modules. Pi 4 / Pi 3 have no PCIe, so they rely on USB accelerators.

### Pi 5 (M.2 HAT+)

| Module | Compute | Interface | PyTorch/ONNX | Notes |
|--------|:---:|-----------|:---:|-------|
| [Hailo-8](https://hailo.ai/) | 26 TOPS | M.2 (Pi AI HAT+) | yes | Higher-end AI HAT+ option |
| [Hailo-8L](https://hailo.ai/) | 13 TOPS | M.2 (Pi AI Kit) | yes | Official Pi 5 AI Kit chip; ~$70 |
| [Axelera Metis M.2](https://axelera.ai/ai-accelerators) | 214 TOPS | M.2 | yes (Voyager SDK) | Highest compute; model zoo still limited |
| [DEEPX DX-M1](https://deepx.ai/products/dx-m1/) | 25 TOPS | M.2 | yes (DXNN SDK) | Digi-Key stock, industrial temp range |
| [Coral M.2 Dual Edge TPU](https://coral.ai/products/m2-accelerator-dual-edgetpu/) | 8 TOPS | M.2 E-key | TFLite only | Cheapest; needs dual-lane E-key slot |
| [Coral M.2 Edge TPU](https://coral.ai/products/m2-accelerator-ae/) | 4 TOPS | M.2 A+E-key | TFLite only | Single-TPU variant |

### Pi 4 / Pi 3 and older (USB)

No PCIe on these boards — USB accelerators only. Works on Pi 4, Pi 3B+, and most Linux SBCs.

| Module | Compute | Interface | PyTorch/ONNX | Notes |
|--------|:---:|-----------|:---:|-------|
| [Hailo-8 USB stick](https://hailo.ai/) | 26 TOPS | USB 3.0 | yes | Fastest USB option; ~5W peak |
| [Coral USB Accelerator](https://coral.ai/products/accelerator/) | 4 TOPS | USB 3.0 | TFLite only | Works on Pi 3B+/4; driver updates stalled |
| [Intel NCS2 (Myriad X)](https://www.intel.com/content/www/us/en/developer/tools/neural-compute-stick/overview.html) | 4 TOPS | USB 3.0 | OpenVINO | EOL, no driver updates since ~2021 |
| [Orange Pi AI Stick (Lyeffe)](http://www.orangepi.org/) | ~2.8 TOPS | USB | limited | Myriad-class; sparse support |
| [Toybrick RK1808 (TB-RK1808S0)](https://t.rock-chips.com/en/) | ~3 TOPS | USB | RKNN toolkit | Rockchip RK1808 USB compute stick |

### Notes on Pi compatibility

- **Coral** hasn't seen meaningful driver/runtime updates in years; expect friction with recent Python/OS releases. Still fine for TFLite vision.
- **NCS2** is discontinued (EOL); usable only on legacy OpenVINO. Buy only from remaining stock.
- **Multi-accelerator rigs** (e.g. several Coral + Hailo behind a PCIe switch on Pi 5) work but need driver/overlay hacks and offer limited multi-chip software support.
- **Mobilint / Rebellions / FuriosaAI** make no M.2 or USB part and cannot attach to a Pi.

## Software

The tooling that turns a trained model into something an NPU can run: vendor SDKs, cross-vendor compilers, runtimes, and the optimization steps (quantization especially) that edge deployment depends on.

### Vendor SDKs & toolchains

Each NPU vendor ships its own compiler/quantizer. Most take ONNX or a framework graph and emit a device-specific binary.

| SDK | Vendor | Input | Notes |
|-----|--------|-------|-------|
| [DXNN](https://deepx.ai/) | DEEPX | PyTorch / ONNX / TF | Compiler + runtime for DX-M1/M2 |
| [qb SDK](https://www.mobilint.com/) | Mobilint | ONNX | Model compiler + tools for ARIES/REGULUS |
| [Dataflow Compiler (DFC)](https://hailo.ai/developer-zone/) | Hailo | ONNX / TFLite | Compiles to Hailo-8/10H; PyTorch via ONNX |
| [Voyager SDK](https://axelera.ai/) | Axelera | ONNX / PyTorch | Metis toolchain; 100+ model zoo |
| [OpenVINO](https://github.com/openvinotoolkit/openvino) | Intel | ONNX / IR | Optimizes for Intel CPU/GPU/NPU + Myriad |
| [Edge TPU Compiler](https://coral.ai/docs/edgetpu/compiler/) | Google | TFLite (INT8) | Compiles quantized TFLite for Coral |
| [RKNN-Toolkit2](https://github.com/airockchip/rknn-toolkit2) | Rockchip | ONNX / TF / others | For RK3588/RK1808 NPU |
| [SiMa Palette](https://sima.ai/) | SiMa.ai | ONNX | MLSoC compiler + SDK |
| [MemryX SDK](https://developer.memryx.com/) | MemryX | ONNX / TFLite / PyTorch | Dataflow compiler for MX3 |
| [Furiosa SDK](https://github.com/furiosa-ai) | FuriosaAI | ONNX | Compiler, runtime, K8s integration for RNGD |
| [eIQ](https://www.nxp.com/design/design-center/software/eiq-ml-development-environment:EIQ) | NXP | ONNX / TFLite | ML toolkit spanning MCU → i.MX → Ara DNPU |

### Compilers & IR

Vendor-neutral compiler stacks that lower a model through an intermediate representation to hardware-specific code.

- [Apache TVM](https://github.com/apache/tvm) — deep-learning compiler with auto-scheduling; microTVM targets MCUs/NPUs
- [IREE](https://github.com/iree-org/iree) — MLIR-based compiler + runtime for edge to datacenter
- [MLIR](https://github.com/llvm/llvm-project/tree/main/mlir) — LLVM compiler infrastructure underlying many NPU stacks
- [Glow](https://github.com/pytorch/glow) — Meta's ML graph compiler for accelerators
- [XLA](https://github.com/openxla/xla) — operation-fusion compiler (TF/JAX), influences edge compiler design
- [OpenXLA / StableHLO](https://github.com/openxla/stablehlo) — portable HLO dialect across compilers

### Runtimes & inference engines

Cross-vendor runtimes that dispatch to CPU/GPU/NPU back-ends.

- [ONNX Runtime](https://github.com/microsoft/onnxruntime) — execution-provider interface binds graphs to NPU back-ends (NNAPI, OpenVINO, TensorRT, QNN)
- [ExecuTorch](https://github.com/pytorch/executorch) — PyTorch Edge runtime for mobile/embedded/MCU with NPU delegation
- [TensorFlow Lite / LiteRT](https://github.com/google-ai-edge/LiteRT) — on-device runtime; NNAPI/GPU/NPU delegates
- [LiteRT-LM](https://github.com/google-ai-edge/LiteRT-LM) — LiteRT extension for on-device LLMs
- [NCNN](https://github.com/Tencent/ncnn) — Tencent's mobile-first inference framework
- [MNN](https://github.com/alibaba/MNN) — Alibaba's lightweight edge inference engine
- [MACE](https://github.com/XiaoMi/mace) — Xiaomi's mobile NN accelerator
- [TNN](https://github.com/Tencent/TNN) — Tencent cross-platform inference framework
- [NNAPI](https://developer.android.com/ndk/guides/neuralnetworks) — Android's neural networks hardware abstraction (legacy; superseded by LiteRT delegates)
- [QNN (Qualcomm AI Engine Direct)](https://www.qualcomm.com/developer/software/qualcomm-ai-engine-direct-sdk) — low-level Hexagon NPU access

### LLM on edge

Running local language models on constrained hardware.

- [llama.cpp](https://github.com/ggml-org/llama.cpp) — CPU-first GGUF inference, minimal setup
- [Ollama](https://github.com/ollama/ollama) — local LLM runner built on llama.cpp
- [MLC LLM](https://github.com/mlc-ai/mlc-llm) — TVM-based LLM deployment across GPU/NPU/mobile
- [torchchat](https://github.com/pytorch/torchchat) — PyTorch local LLM inference (server/desktop/mobile)

### Model optimization (quantization / pruning)

The step that makes models fit an NPU — usually INT8 quantization.

- [Neural Network Compression Framework (NNCF)](https://github.com/openvinotoolkit/nncf) — Intel quantization/pruning for OpenVINO
- [PyTorch Quantization](https://pytorch.org/docs/stable/quantization.html) — native PTQ/QAT (eager + FX + export)
- [TensorFlow Model Optimization Toolkit](https://github.com/tensorflow/model-optimization) — quantization, pruning, clustering
- [ONNX Runtime quantization](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html) — post-training INT8 for ONNX
- [AIMET](https://github.com/quic/aimet) — Qualcomm's model-efficiency toolkit (quant + compression)
- [Brevitas](https://github.com/Xilinx/brevitas) — AMD/Xilinx quantization-aware training in PyTorch

### Benchmarks

- [MLPerf Inference](https://github.com/mlcommons/inference) — MLCommons standard inference benchmark (edge + datacenter suites)
- [MLPerf Tiny](https://github.com/mlcommons/tiny) — benchmark for MCU-class TinyML
- [ai-benchmark](https://ai-benchmark.com/) — mobile SoC / NPU benchmark
- [EEMBC MLMark](https://www.eembc.org/mlmark/) — embedded ML benchmark

### Model zoos

- [ONNX Model Zoo](https://github.com/onnx/models) — pre-trained models in ONNX
- [Hailo Model Zoo](https://github.com/hailo-ai/hailo_model_zoo) — models pre-compiled for Hailo
- [OpenVINO Open Model Zoo](https://github.com/openvinotoolkit/open_model_zoo) — Intel pre-trained models + demos
- [Coral Models](https://coral.ai/models/) — Edge TPU-compiled TFLite models
- [timm](https://github.com/huggingface/pytorch-image-models) — PyTorch image models, common export source

## Learning resources

- [Awesome Edge Machine Learning](https://github.com/Bisonai/awesome-edge-machine-learning) — curated edge ML list
- [Awesome Model Quantization](https://github.com/htqin/awesome-model-quantization) — quantization papers and methods
- [Awesome Embedded / TinyML](https://github.com/gigwegbe/tinyml-papers-and-projects) — TinyML papers and projects
- [Model-Inference-Deployment](https://github.com/Yulv-git/Model-Inference-Deployment) — inference framework comparison (OpenVINO, TVM, NCNN, MNN, …)
- [Jeff Geerling – Raspberry Pi AI](https://www.jeffgeerling.com/blog) — hands-on Pi + NPU experiments

## Glossary

- NPU — Neural Processing Unit
- LPU — LLM Processing Unit; NPU subclass for LLM inference
- VPU — Vision Processing Unit
- DNPU — Discrete NPU (standalone, not SoC-integrated)
- TOPS / POPS — Tera / Peta Operations Per Second (precision-dependent)
- SoM — System on Module
- IR — Intermediate Representation; the mid-level form a compiler lowers a model into
- PTQ / QAT — Post-Training Quantization / Quantization-Aware Training
- Delegate / Execution Provider — runtime plugin that offloads a subgraph to a specific accelerator
- GGUF — quantized model file format used by llama.cpp

## Contributing

PRs welcome. Cite the source, state precision and whether a figure is a boost value, list price only when officially disclosed, and mark non-standalone parts with `⚠`.
