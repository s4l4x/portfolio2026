import type { ScreenInset } from "../types/media";
import iphone6WhiteFrame from "../assets/devices/iphone6-white.png";
import iphone4Frame from "../assets/devices/iphone4.png";

// Screen rect: x=65, y=233, w=640, h=1136 in 770x1602 frame
export const iphone6White: { frameSrc: string; screenInset: ScreenInset } = {
  frameSrc: iphone6WhiteFrame,
  screenInset: {
    top: "14.54%",
    left: "8.44%",
    right: "8.44%",
    bottom: "14.54%",
  },
};

// Screen rect: x=64, y=265, w=640, h=960 in 768x1490 frame
export const iphone4Black: { frameSrc: string; screenInset: ScreenInset } = {
  frameSrc: iphone4Frame,
  screenInset: {
    top: "17.79%",
    left: "8.33%",
    right: "8.33%",
    bottom: "17.79%",
  },
};
