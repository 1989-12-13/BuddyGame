import pptxgen from "pptxgenjs";
import React from "react";
import ReactDOMServer from "react-dom/server";
import sharp from "sharp";
import {
  FaClock, FaExclamationTriangle, FaUsers, FaHeartbeat,
  FaPhone, FaQuestionCircle, FaClipboardList, FaBrain,
  FaAmbulance, FaGamepad, FaStar, FaRocket,
  FaMicrochip, FaCogs, FaShieldAlt, FaChartLine,
  FaLaptopCode, FaServer, FaDatabase, FaMobileAlt,
  FaLayerGroup, FaRedo, FaCheckCircle, FaArrowRight,
  FaLightbulb, FaGlobeAsia, FaBookOpen, FaGraduationCap,
  FaMedkit, FaTrophy, FaMapMarkerAlt, FaBolt,
  FaHeadset, FaComments, FaHeart, FaHandHoldingHeart,
  FaRobot, FaCheckDouble, FaTools, FaUserMd,
  FaSyncAlt, FaBullseye, FaHourglassHalf, FaCertificate
} from "react-icons/fa";

// ========== COLOR PALETTE ==========
const C = {
  navy:       "1A365D",
  red:        "E53E3E",
  bg:         "FFFFFF",
  sectionBg:  "F8FAFC",
  text:       "1A202C",
  textMuted:  "4A5568",
  textLight:  "A0AEC0",
  cardBg:     "FFFFFF",
  darkBg:     "1A365D",
};

// ========== HELPER FUNCTIONS ==========
function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// ========== TITLE BAR HELPER (统一 fix #7) ==========
function addTitleBar(slide, pres, title, subtitle) {
  // Section background strip
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 1.3, fill: { color: C.sectionBg },
  });
  // Title
  slide.addText(title, {
    x: 0.6, y: 0.15, w: 8.8, h: 0.6,
    fontSize: 24, fontFace: "Microsoft YaHei", color: C.navy, bold: true,
    margin: 0, valign: "middle", align: "left",
  });
  // Subtitle
  slide.addText(subtitle, {
    x: 0.6, y: 0.72, w: 8.8, h: 0.35,
    fontSize: 11, fontFace: "Microsoft YaHei", color: C.textMuted,
    margin: 0, valign: "middle", align: "left",
  });
  // 统一装饰线 — 所有内页相同规格
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0.6, y: 1.08, w: 0.6, h: 0.04, fill: { color: C.red },
  });
}

// ========== DARK SLIDE (封面/致谢) ==========
async function createDarkSlide(pres, title, tagline, subtitle) {
  const slide = pres.addSlide();
  slide.background = { color: C.darkBg };

  // Top accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.red },
  });

  // Decorative left bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.red, transparency: 80 },
  });

  // Main title
  slide.addText(title, {
    x: 0.5, y: 1.5, w: 9, h: 1.2,
    fontSize: 40, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true,
    align: "center", valign: "middle",
  });

  // Tagline
  slide.addText(tagline, {
    x: 1.5, y: 2.8, w: 7, h: 0.6,
    fontSize: 18, fontFace: "Microsoft YaHei", color: C.red,
    align: "center", valign: "middle",
  });

  // Decorative line
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 3.8, y: 3.5, w: 2.4, h: 0.04, fill: { color: C.red },
  });

  // Subtitle / info
  slide.addText(subtitle, {
    x: 1, y: 3.8, w: 8, h: 0.8,
    fontSize: 14, fontFace: "Microsoft YaHei", color: C.textLight,
    align: "center", valign: "middle",
  });

  // Bottom accent bar
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.red },
  });

  return slide;
}

// ========== MAIN ==========
async function main() {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "BuddyGame Team";
  pres.title = "120 调度台 — 急救调度模拟训练系统";
  pres.subject = "BuddyGame 路演汇报";

  // Pre-render icons for performance
  console.log("Rendering icons...");

  // Icons for slide 2 (pain points) — 使用白色 (#FFFFFF) 以在红底上可见 (fix #1)
  const iconClock    = await iconToBase64Png(FaClock,                "#FFFFFF", 256);
  const iconWarning  = await iconToBase64Png(FaExclamationTriangle,  "#FFFFFF", 256);
  const iconUsers    = await iconToBase64Png(FaUsers,               "#FFFFFF", 256);
  const iconHeart    = await iconToBase64Png(FaHeartbeat,            "#FFFFFF", 256);

  // Other icons (navy or red)
  // Icons for red-circle backgrounds — MUST be white for visibility (fixes QA regressions)
  const iconPhone    = await iconToBase64Png(FaPhone,                "#1A365D", 256);
  const iconRobotW   = await iconToBase64Png(FaRobot,                "#FFFFFF", 256);  // for red bg
  const iconSyncW    = await iconToBase64Png(FaSyncAlt,              "#FFFFFF", 256);  // for red bg
  const iconBookW    = await iconToBase64Png(FaBookOpen,             "#FFFFFF", 256);  // for red bg
  const iconGameW    = await iconToBase64Png(FaGamepad,              "#FFFFFF", 256);  // for red bg
  const iconQ        = await iconToBase64Png(FaQuestionCircle,       "#1A365D", 256);
  const iconClip     = await iconToBase64Png(FaClipboardList,        "#1A365D", 256);
  const iconBrain    = await iconToBase64Png(FaBrain,                "#1A365D", 256);
  const iconAmb      = await iconToBase64Png(FaAmbulance,            "#1A365D", 256);
  const iconGame     = await iconToBase64Png(FaGamepad,             "#1A365D", 256);
  const iconStar     = await iconToBase64Png(FaStar,                 "#1A365D", 256);
  const iconRocket   = await iconToBase64Png(FaRocket,              "#1A365D", 256);
  const iconMC       = await iconToBase64Png(FaMicrochip,            "#1A365D", 256);
  const iconCogs     = await iconToBase64Png(FaCogs,                "#1A365D", 256);
  const iconShield   = await iconToBase64Png(FaShieldAlt,            "#1A365D", 256);
  const iconChart    = await iconToBase64Png(FaChartLine,            "#1A365D", 256);
  const iconLaptop   = await iconToBase64Png(FaLaptopCode,           "#1A365D", 256);
  const iconServer   = await iconToBase64Png(FaServer,               "#1A365D", 256);
  const iconDB       = await iconToBase64Png(FaDatabase,             "#1A365D", 256);
  const iconMobile   = await iconToBase64Png(FaMobileAlt,           "#1A365D", 256);
  const iconLayer    = await iconToBase64Png(FaLayerGroup,           "#1A365D", 256);
  const iconRedo     = await iconToBase64Png(FaRedo,                 "#E53E3E", 256);
  const iconCheck    = await iconToBase64Png(FaCheckCircle,          "#E53E3E", 256);
  const iconArrow    = await iconToBase64Png(FaArrowRight,           "#E53E3E", 256);
  const iconBulb     = await iconToBase64Png(FaLightbulb,            "#E53E3E", 256);
  const iconGlobe    = await iconToBase64Png(FaGlobeAsia,           "#E53E3E", 256);
  const iconBook     = await iconToBase64Png(FaBookOpen,             "#E53E3E", 256);
  const iconGrad     = await iconToBase64Png(FaGraduationCap,        "#E53E3E", 256);
  const iconMedkit   = await iconToBase64Png(FaMedkit,              "#E53E3E", 256);
  const iconTrophy   = await iconToBase64Png(FaTrophy,               "#E53E3E", 256);
  const iconMM       = await iconToBase64Png(FaMapMarkerAlt,         "#E53E3E", 256);
  const iconBolt     = await iconToBase64Png(FaBolt,                 "#E53E3E", 256);
  const iconHeadset  = await iconToBase64Png(FaHeadset,              "#E53E3E", 256);
  const iconComment  = await iconToBase64Png(FaComments,            "#E53E3E", 256);
  const iconHearth   = await iconToBase64Png(FaHeart,               "#E53E3E", 256);
  const iconHH       = await iconToBase64Png(FaHandHoldingHeart,     "#E53E3E", 256);
  const iconRobot    = await iconToBase64Png(FaRobot,                "#E53E3E", 256);
  const iconCD       = await iconToBase64Png(FaCheckDouble,          "#E53E3E", 256);
  const iconTools    = await iconToBase64Png(FaTools,                "#E53E3E", 256);
  const iconDoc      = await iconToBase64Png(FaUserMd,               "#E53E3E", 256);
  const iconSync     = await iconToBase64Png(FaSyncAlt,              "#E53E3E", 256);
  const iconTarget   = await iconToBase64Png(FaBullseye,             "#E53E3E", 256);
  const iconHourglass= await iconToBase64Png(FaHourglassHalf,        "#E53E3E", 256);
  const iconCert     = await iconToBase64Png(FaCertificate,          "#E53E3E", 256);

  console.log("Generating slides...");

  // ========== SLIDE 1: COVER ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.darkBg };

    // Top accent bar
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.06, fill: { color: C.red } });
    // Left decorative bar
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 0.08, h: 5.625, fill: { color: C.red, transparency: 80 } });

    // Brand tag
    slide.addText("BUDDYGAME", {
      x: 0.5, y: 0.4, w: 9, h: 0.4,
      fontSize: 12, fontFace: "Arial", color: C.textLight,
      align: "center", charSpacing: 6, margin: 0,
    });

    // Main title
    slide.addText("120 调度台", {
      x: 0.5, y: 1.3, w: 9, h: 1.0,
      fontSize: 44, fontFace: "Microsoft YaHei", color: "FFFFFF", bold: true,
      align: "center", valign: "middle",
    });

    // Subtitle
    slide.addText("急救调度模拟训练系统", {
      x: 0.5, y: 2.3, w: 9, h: 0.6,
      fontSize: 22, fontFace: "Microsoft YaHei", color: C.red,
      align: "center", valign: "middle",
    });

    // Quote
    slide.addText("\u201C每一次调度，都是一场与时间的赛跑\u201D", {
      x: 1.5, y: 3.2, w: 7, h: 0.5,
      fontSize: 13, fontFace: "Microsoft YaHei", color: C.textLight, italic: true,
      align: "center", valign: "middle",
    });

    // Info line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 3.8, y: 3.9, w: 2.4, h: 0.03, fill: { color: C.red },
    });

    // Team & date
    slide.addText("BuddyGame 开发团队  |  2025", {
      x: 0.5, y: 4.3, w: 9, h: 0.4,
      fontSize: 12, fontFace: "Microsoft YaHei", color: C.textLight,
      align: "center", valign: "middle",
    });

    // Bottom bar
    slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.565, w: 10, h: 0.06, fill: { color: C.red } });
  }

  // ========== SLIDE 2: 行业痛点 (PAIN POINTS) — FIX #1: 红底图标用白色 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "行业痛点", "当前急救调度培训体系面临的挑战");

    // — Left: 4 pain points (icon in red circle + white icon) —
    const pains = [
      { icon: iconClock,   title: "训练机会稀缺",   desc: "真实调度场景学习周期长，实习生难以积累经验" },
      { icon: iconWarning, title: "考核标准模糊",   desc: "缺乏客观量化评估体系，培训效果难以衡量" },
      { icon: iconUsers,   title: "师资力量不均",   desc: "优质导师主要集中在发达地区，资源分配差异大" },
      { icon: iconHeart,   title: "心理压力巨大",   desc: "真实环境试错成本高，一次失误可能危及生命" },
    ];

    pains.forEach((p, i) => {
      const yBase = 1.6 + i * 0.95;
      // Red circle (icon bg)
      slide.addShape(pres.shapes.OVAL, {
        x: 0.6, y: yBase + 0.08, w: 0.45, h: 0.45, fill: { color: C.red },
      });
      // White icon on red bg (FIX #1)
      slide.addImage({ data: p.icon, x: 0.67, y: yBase + 0.15, w: 0.3, h: 0.3 });
      // Title
      slide.addText(p.title, {
        x: 1.25, y: yBase, w: 2.5, h: 0.35,
        fontSize: 14, fontFace: "Microsoft YaHei", color: C.text, bold: true,
        margin: 0, valign: "middle", align: "left",
      });
      // Description
      slide.addText(p.desc, {
        x: 1.25, y: yBase + 0.35, w: 3.2, h: 0.3,
        fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted,
        margin: 0, valign: "top", align: "left",
      });
    });

    // — Right: 2 stat cards — 加大红条与数字间距 + 内容均匀填充 (FIX #1)
    const stats = [
      {
        num: "2,000+", label: "通/年\n全国院前急救电话量",
        desc: "每秒接听需求，调度员必须在 60 秒内完成问询分诊",
        extra: "高压环境下快速判定病情等级是调度员核心能力",
      },
      {
        num: "<15%", label: "培训覆盖率\n模拟训练普及率",
        desc: "多数地区依赖传统跟班见习，缺乏系统性模拟训练",
        extra: "模拟训练可显著提升调度员首次响应准确率",
      },
    ];

    stats.forEach((s, i) => {
      const xBase = 5.5 + i * 2.15;
      // Card background
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.6, w: 1.95, h: 3.7,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 },
      });
      // Red top accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 1.6, w: 1.95, h: 0.06, fill: { color: C.red },
      });
      // Big number — 下移加大与红条间距
      slide.addText(s.num, {
        x: xBase, y: 1.95, w: 1.95, h: 0.55,
        fontSize: 30, fontFace: "Arial", color: C.red, bold: true,
        align: "center", valign: "middle",
      });
      // Label
      slide.addText(s.label, {
        x: xBase + 0.15, y: 2.6, w: 1.65, h: 0.55,
        fontSize: 11, fontFace: "Microsoft YaHei", color: C.text, bold: true,
        align: "center", valign: "middle",
      });
      // Description
      slide.addText(s.desc, {
        x: xBase + 0.15, y: 3.25, w: 1.65, h: 0.5,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "left", valign: "top",
      });
      // Extra info
      slide.addText(s.extra, {
        x: xBase + 0.15, y: 3.85, w: 1.65, h: 0.5,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "left", valign: "top",
      });
    });
  }

  // ========== SLIDE 3: 产品概述 (PRODUCT OVERVIEW) — FIX #6: 统一卡片底部 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "产品概述", "一款以 MPDS 标准为核心的急救调度模拟训练系统");

    // Tagline banner
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 1.55, w: 8.8, h: 0.5, fill: { color: C.sectionBg },
    });
    slide.addText("基于真实 MPDS 急救调度协议的精简模拟，融合语音交互与 Roguelike 技能成长机制", {
      x: 0.8, y: 1.55, w: 8.4, h: 0.5,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.textMuted,
      align: "center", valign: "middle", margin: 0,
    });

    // — 3 keyword cards — 统一 h:2.6 (FIX #6)
    const keywords = [
      { icon: iconPhone, title: "MPDS 标准问询", desc: "内置 33 种急救场景，遵循 MPDS 5 步问询协议，覆盖从接听到派车的完整调度流程" },
      { icon: iconRobotW, title: "AI 语音交互", desc: "集成火山引擎 TTS 语音合成，来电者压力值动态变化，模拟真实通话紧张感" },
      { icon: iconSyncW, title: "Roguelike 成长", desc: "技能卡驱动角色成长，5 维评分系统（满分 100/通），多结局分支与成就系统" },
    ];

    const cardW = 2.7;
    const gap = 0.3;
    const startX = 0.6;
    const cardH = 2.55;
    const cardY = 2.35;

    keywords.forEach((k, i) => {
      const xBase = startX + i * (cardW + gap);

      // Card bg
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: cardY, w: cardW, h: cardH,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 },
      });
      // Red left accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: cardY, w: 0.06, h: cardH, fill: { color: C.red },
      });
      // Icon in red circle
      slide.addShape(pres.shapes.OVAL, {
        x: xBase + cardW / 2 - 0.3, y: cardY + 0.25, w: 0.6, h: 0.6, fill: { color: C.red },
      });
      slide.addImage({ data: k.icon, x: xBase + cardW / 2 - 0.22, y: cardY + 0.33, w: 0.44, h: 0.44 });
      // Title
      slide.addText(k.title, {
        x: xBase + 0.15, y: cardY + 0.95, w: cardW - 0.3, h: 0.4,
        fontSize: 14, fontFace: "Microsoft YaHei", color: C.text, bold: true,
        align: "center", valign: "middle",
      });
      // Description — 统一高度与对齐 (FIX #6)
      slide.addText(k.desc, {
        x: xBase + 0.2, y: cardY + 1.4, w: cardW - 0.4, h: 0.95,
        fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "center", valign: "top",
      });
    });
  }

  // ========== SLIDE 4: 核心玩法 (CORE MPDS FLOW) — FIX #4: 去底部留白 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "核心玩法", "遵循 MPDS 标准协议的完整调度流程");

    const steps = [
      { icon: iconPhone, label: "接听",  desc: "接听报警\n获取基本信息\n位置 & 联系方式" },
      { icon: iconQ,     label: "事件",  desc: "判断事件类型\n确定主诉\n紧急程度初筛" },
      { icon: iconClip,  label: "信息",  desc: "询问关键信息\n获取详细病情\n按 MPDS 逐项问询" },
      { icon: iconBrain, label: "意识",  desc: "评估意识状态\n判断生命体征\n确定反应等级" },
      { icon: iconAmb,   label: "派车",  desc: "分诊判定派车\n电话急救指导\n完成调度闭环" },
    ];

    const stepW = 1.5;
    const gap = 0.2;
    const startX = 0.5;
    const stepH = 1.65;
    const stepY = 1.55;

    steps.forEach((s, i) => {
      const xBase = startX + i * (stepW + gap);

      // Step card
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: stepY, w: stepW, h: stepH,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 6, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
      });
      // Number circle top — 下移 0.05" 避免与卡片上沿相切
      slide.addShape(pres.shapes.OVAL, {
        x: xBase + stepW / 2 - 0.18, y: stepY + 0.15, w: 0.36, h: 0.36, fill: { color: C.red },
      });
      slide.addText(String(i + 1), {
        x: xBase + stepW / 2 - 0.18, y: stepY + 0.15, w: 0.36, h: 0.36,
        fontSize: 14, fontFace: "Arial", color: "FFFFFF", bold: true,
        align: "center", valign: "middle",
      });
      // Step label
      slide.addText(s.label, {
        x: xBase, y: stepY + 0.5, w: stepW, h: 0.28,
        fontSize: 12, fontFace: "Microsoft YaHei", color: C.navy, bold: true,
        align: "center", valign: "middle",
      });
      // Step desc — 内容均匀垂直分布 (FIX #4)
      slide.addText(s.desc, {
        x: xBase + 0.1, y: stepY + 0.82, w: stepW - 0.2, h: 0.75,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "center", valign: "middle",
      });

      // Arrow between cards (except last)
      if (i < steps.length - 1) {
        slide.addImage({
          data: iconArrow,
          x: xBase + stepW + 0.02, y: stepY + stepH / 2 - 0.15, w: 0.2, h: 0.3,
        });
      }
    });

    // Bottom banner — 下移至 y:3.55 加大与步骤卡间距
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 3.55, w: 8.8, h: 0.45, fill: { color: C.sectionBg },
    });
    slide.addText("5 步问询 + TTS 语音模拟 + 压力值机制 = 沉浸式调度训练体验", {
      x: 0.8, y: 3.55, w: 8.4, h: 0.45,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.textMuted,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ========== SLIDE 5: 功能矩阵 (FEATURE MATRIX) ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "功能矩阵", "六大核心模块构建完整调度训练闭环");

    const features = [
      { icon: iconHeadset,  title: "来电压力系统",   desc: "来电者情绪紧张度动态变化，影响问询质量，模拟真实通话张力" },
      { icon: iconClip,     title: "MPDS 调度卡",     desc: "专业 Terminal 风格的调度决策卡片，辅助分诊判定与资源调度" },
      { icon: iconAmb,      title: "多车派车系统",     desc: "3 辆差异化救护车管理，根据病情分级智能匹配最优派车方案" },
      { icon: iconGame,     title: "急救指导小游戏",   desc: "7 种互动式电话急救指导（CPR、止血、海姆立克等）增强操作记忆" },
      { icon: iconStar,     title: "五维评分系统",     desc: "覆盖问询质量、分诊准确度、派车时效、指导完成度、综合表现的评分体系" },
      { icon: iconRocket,   title: "Roguelike 技能",   desc: "4 类技能卡（冷静/专业/效率/急救），千层塔式深度与多结局解锁" },
    ];

    const itemW = 2.65;
    const itemH = 1.55;
    const gapX = 0.5;
    const gapY = 0.5;
    const startX = 0.55;
    const startY = 1.55;

    features.forEach((f, i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const xBase = startX + col * (itemW + gapX);
      const yBase = startY + row * (itemH + gapY);

      // Card bg
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: yBase, w: itemW, h: itemH,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 6, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
      });
      // Top red accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: yBase, w: itemW, h: 0.05, fill: { color: C.red },
      });
      // Icon in small circle
      slide.addShape(pres.shapes.OVAL, {
        x: xBase + 0.15, y: yBase + 0.2, w: 0.35, h: 0.35, fill: { color: C.red },
      });
      slide.addImage({
        data: f.icon, x: xBase + 0.21, y: yBase + 0.26, w: 0.23, h: 0.23,
      });
      // Title
      slide.addText(f.title, {
        x: xBase + 0.6, y: yBase + 0.15, w: itemW - 0.75, h: 0.4,
        fontSize: 13, fontFace: "Microsoft YaHei", color: C.text, bold: true,
        margin: 0, valign: "middle", align: "left",
      });
      // Description
      slide.addText(f.desc, {
        x: xBase + 0.15, y: yBase + 0.65, w: itemW - 0.3, h: 0.8,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "left", valign: "top",
      });
    });
  }

  // ========== SLIDE 6: 技术架构 (TECH ARCHITECTURE) — FIX #3: 徽章 3x3 网格 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "技术架构", "现代化技术栈打造高性能调度模拟系统");

    // — Left: 3-layer architecture diagram —
    const layers = [
      { label: "表现层", items: "React 19 + TypeScript 5.8\nVite 6 + CSS Design Tokens\nLeaflet 地图 + TTS 语音", color: C.navy, icon: iconLaptop },
      { label: "调度层", items: "单向数据流 + Reducer 模式\n薄调度层设计\n33 \u00D7 32 场景角色矩阵", color: C.red, icon: iconCogs },
      { label: "数据层", items: "React Context 状态管理\nlocalStorage 持久化\nJSON 驱动的场景/角色配置", color: "2B6CB0", icon: iconDB },
    ];

    const layerW = 2.5;
    const layerH = 1.15;
    const layerGap = 0.15;
    const layerStartY = 1.55;

    layers.forEach((l, i) => {
      const yBase = layerStartY + i * (layerH + layerGap);

      // Layer card
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.6, y: yBase, w: layerW, h: layerH,
        fill: { color: C.sectionBg },
        shadow: { type: "outer", blur: 4, offset: 1, angle: 135, color: "000000", opacity: 0.05 },
      });
      // Left accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.6, y: yBase, w: 0.06, h: layerH, fill: { color: l.color },
      });
      // Layer label
      slide.addText(l.label, {
        x: 0.8, y: yBase + 0.08, w: 2.1, h: 0.3,
        fontSize: 12, fontFace: "Microsoft YaHei", color: l.color, bold: true,
        margin: 0, valign: "middle",
      });
      // Layer items
      slide.addText(l.items, {
        x: 0.8, y: yBase + 0.4, w: 2.1, h: 0.7,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.textMuted,
        margin: 0, valign: "top",
      });
    });

    // Arrow connecting layers
    slide.addText("▼", {
      x: 1.5, y: layerStartY + layerH, w: 0.7, h: 0.15,
      fontSize: 10, color: C.textLight, align: "center", valign: "middle",
    });
    slide.addText("▼", {
      x: 1.5, y: layerStartY + layerH * 2 + layerGap, w: 0.7, h: 0.15,
      fontSize: 10, color: C.textLight, align: "center", valign: "middle",
    });

    // — Right: Tech stack badges — FIX #3: 3x3 网格
    const techs = [
      "React 19", "TypeScript", "Vite 6",
      "Leaflet", "TTS \u706B\u5C71\u5F15\u64CE", "MPDS \u534F\u8BAE",
      "Reducer", "\u80FD\u529B\u5361\u7CFB\u7EDF", "\u538B\u529B\u503C\u5F15\u64CE",
    ];

    const badgeCols = 3;
    const badgeCardW = 4.0;
    const badgeCardH = 3.75;
    const badgeCardX = 5.5;
    const badgeCardY = 1.55;

    // Card bg for badges
    slide.addShape(pres.shapes.RECTANGLE, {
      x: badgeCardX, y: badgeCardY, w: badgeCardW, h: badgeCardH,
      fill: { color: C.cardBg },
      shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 },
    });

    slide.addText("技术栈全景", {
      x: badgeCardX, y: badgeCardY + 0.12, w: badgeCardW, h: 0.35,
      fontSize: 13, fontFace: "Microsoft YaHei", color: C.navy, bold: true,
      align: "center", valign: "middle",
    });

    slide.addShape(pres.shapes.RECTANGLE, {
      x: badgeCardX + 1.5, y: badgeCardY + 0.5, w: 1.0, h: 0.03, fill: { color: C.red },
    });

    // 3x3 grid
    const badgeStartX = badgeCardX + 0.3;
    const badgeStartY = badgeCardY + 0.7;
    const badgeW = 1.05;
    const badgeH = 0.38;
    const badgeGapX = 0.15;
    const badgeGapY = 0.18;

    techs.forEach((t, i) => {
      const col = i % badgeCols;
      const row = Math.floor(i / badgeCols);
      const bx = badgeStartX + col * (badgeW + badgeGapX);
      const by = badgeStartY + row * (badgeH + badgeGapY);

      slide.addShape(pres.shapes.RECTANGLE, {
        x: bx, y: by, w: badgeW, h: badgeH,
        fill: { color: C.sectionBg },
      });
      slide.addText(t, {
        x: bx, y: by, w: badgeW, h: badgeH,
        fontSize: 9, fontFace: "Microsoft YaHei", color: C.navy, bold: true,
        align: "center", valign: "middle",
      });
    });
  }

  // ========== SLIDE 7: 创新亮点 (INNOVATION) — FIX #2: 标题避免孤字换行 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "创新亮点", "三大核心优势构筑产品壁垒");

    const innovations = [
      { icon: iconBookW, title: "MPDS 标准还原",      desc: "基于国际 MPDS 协议精简设计，33 种急救场景覆盖 95%+ 日常呼救类型，学员在模拟中掌握标准调度流程" },
      { icon: iconRobotW, title: "AI 驱动语音模拟",     desc: "火山引擎 TTS 技术驱动 32 种来电者角色交互，压力值动态调节问询难度，还原真实通话的紧张氛围" },
      { icon: iconGameW, title: "游戏化急救指导",     desc: "7 种互动式急救指导小游戏（CPR/止血/海姆立克法），技能成长与多结局，激励反复练习" },
    ];

    const cardW = 2.7;
    const cardGap = 0.3;
    const cardStartX = 0.6;
    const cardH = 3.0;
    const cardY = 1.6;

    innovations.forEach((inv, i) => {
      const xBase = cardStartX + i * (cardW + cardGap);

      // Card bg
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: cardY, w: cardW, h: cardH,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.08 },
      });
      // Red top accent bar
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: cardY, w: cardW, h: 0.06, fill: { color: C.red },
      });

      // Icon circle
      slide.addShape(pres.shapes.OVAL, {
        x: xBase + cardW / 2 - 0.28, y: cardY + 0.25, w: 0.56, h: 0.56, fill: { color: C.red },
      });
      slide.addImage({
        data: inv.icon,
        x: xBase + cardW / 2 - 0.2, y: cardY + 0.33, w: 0.4, h: 0.4,
      });

      // Title — 加宽文本框避免孤字换行
      slide.addText(inv.title, {
        x: xBase + 0.2, y: cardY + 0.9, w: cardW - 0.4, h: 0.45,
        fontSize: 14, fontFace: "Microsoft YaHei", color: C.text, bold: true,
        align: "center", valign: "middle",
      });

      // Description — 加高填充卡片底部空白
      slide.addText(inv.desc, {
        x: xBase + 0.2, y: cardY + 1.4, w: cardW - 0.4, h: 1.5,
        fontSize: 10, fontFace: "Microsoft YaHei", color: C.textMuted,
        align: "center", valign: "top",
      });
    });
  }

  // ========== SLIDE 8: 未来规划 (ROADMAP) — FIX #5: 统一圆点 + 提高对比度 ==========
  {
    const slide = pres.addSlide();
    slide.background = { color: C.bg };
    addTitleBar(slide, pres, "未来规划", "清晰分阶段的演进路线图");

    const phases = [
      {
        period: "2025 H2", title: "近期目标",
        items: ["完善 33 个 MPDS 场景覆盖", "优化 TTS 语音交互体验", "新增多语言场景支持"],
        icon: iconTarget,
      },
      {
        period: "2026", title: "中期目标",
        items: ["智能评分系统升级（AI 分析）", "多人协作调度模拟模式", "开放 SDK 对接真实培训系统"],
        icon: iconChart,
      },
      {
        period: "2027+", title: "远期目标",
        items: ["VR/AR 沉浸式调度训练", "全国院前急救数据平台", "国际化推广与合作"],
        icon: iconRocket,
      },
    ];

    // Timeline line
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 1.0, y: 2.3, w: 8.0, h: 0.04, fill: { color: C.textLight },
    });

    const phaseW = 2.7;
    const phaseGap = 0.2;
    const phaseStartX = 0.5;

    phases.forEach((p, i) => {
      const xBase = phaseStartX + i * (phaseW + phaseGap);

      // 统一圆点样式 (FIX #5)
      slide.addShape(pres.shapes.OVAL, {
        x: xBase + phaseW / 2 - 0.14, y: 2.17, w: 0.28, h: 0.28,
        fill: { color: C.red },
      });

      // Period label above timeline
      slide.addText(p.period, {
        x: xBase, y: 1.8, w: phaseW, h: 0.3,
        fontSize: 13, fontFace: "Microsoft YaHei", color: C.red, bold: true,
        align: "center", valign: "middle",
      });

      // Phase card below timeline
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 2.65, w: phaseW, h: 2.0,
        fill: { color: C.cardBg },
        shadow: { type: "outer", blur: 6, offset: 1, angle: 135, color: "000000", opacity: 0.06 },
      });
      // Red top accent
      slide.addShape(pres.shapes.RECTANGLE, {
        x: xBase, y: 2.65, w: phaseW, h: 0.04, fill: { color: C.red },
      });

      // Phase title
      slide.addText(p.title, {
        x: xBase + 0.15, y: 2.75, w: phaseW - 0.3, h: 0.35,
        fontSize: 13, fontFace: "Microsoft YaHei", color: C.navy, bold: true,
        align: "center", valign: "middle",
      });

      // Phase items
      slide.addText(
        p.items.map((item, idx) => ({
          text: item,
          options: { bullet: true, breakLine: idx < p.items.length - 1 },
        })),
        {
          x: xBase + 0.15, y: 3.15, w: phaseW - 0.3, h: 1.3,
          fontSize: 9.5, fontFace: "Microsoft YaHei", color: C.textMuted,
          align: "left", valign: "top",
          paraSpaceAfter: 4,
        }
      );
    });

    // Bottom tagline — 加深颜色提高对比度 (FIX #5)
    slide.addShape(pres.shapes.RECTANGLE, {
      x: 0.6, y: 4.85, w: 8.8, h: 0.4, fill: { color: C.sectionBg },
    });
    slide.addText("从模拟训练到智能调度，持续推动急救教育数字化转型", {
      x: 0.8, y: 4.85, w: 8.4, h: 0.4,
      fontSize: 11, fontFace: "Microsoft YaHei", color: C.navy,
      align: "center", valign: "middle", margin: 0,
    });
  }

  // ========== SLIDE 9: 致谢 (THANK YOU) ==========
  {
    await createDarkSlide(
      pres,
      "感谢聆听",
      "\u201C用技术守护每一次生命呼叫\u201D",
      "120 调度台 · 急救调度模拟训练系统\nBuddyGame 开发团队  |  敬请期待"
    );
  }

  // ========== WRITE FILE ==========
  console.log("Writing PPTX...");
  await pres.writeFile({ fileName: "c:/Users/Lenovo/Desktop/buddy/BuddyGame/BuddyGame_Roadshow.pptx" });
  console.log("Done! BuddyGame_Roadshow.pptx generated successfully.");
}

main().catch(console.error);
