import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Server-side Gemini API endpoint for fetching Olympic Team China Achievements & Chinese Archery History insights
  app.post('/api/historical-notes', async (req, res) => {
    try {
      const {
        frontierPass = '北京奧林匹克公園射箭場',
        frontierRegion = '2008 北京奧運會 · 張娟娟奪得中國射箭奧運歷史首金福地',
        rankTitle = '奧運資格賽 · 排名輪',
        bowName = '中國隊奧運奪金主力反曲弓 (48磅)',
        bowDynasty = '奧運國家隊主力競技配置',
        targetDistance = 70,
        ringName = 'X-10環',
        score = 10,
        windName = '東南側風',
        timeOfDay = '決賽夜場 · 金牌戰聚光燈',
        arrowIndex = 1,
      } = req.body || {};

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const prompt = `你是一位專精現代奧林匹克射箭運動史（特別是中國國家射箭隊奧運成就）與中華數千年傳統射藝歷史的體育文化學者。
玩家剛剛在 3D 奧運射箭比賽中命中五色十環靶，請根據以下實時比賽情境，撰寫一則生動、詳實且振奮人心的「中國隊奧運輝煌成就與中華射藝史話」專題解說（使用繁體中文）：

- 當前奧運賽場：${frontierPass}（${frontierRegion}）
- 賽程階段：${rankTitle}（射距 ${targetDistance} 米）
- 所用弓具：${bowName}（${bowDynasty}）
- 命中表現：第 ${arrowIndex} 箭射中「${ringName}」（得 ${score} 環）
- 賽場時段與風勢：${timeOfDay}，${windName}

請結合中國國家射箭隊在奧運會上的真實成就（例如：2008北京奧運張娟娟連克三位韓國名將奪得歷史首金、1984李玲娟首秀五破奧運紀錄奪銀、1992/1996/2004/2008/2012/2024中國女團與何影/戴小祥/李佳蔓/楊曉蕾/安琦軒等國手的經典戰役），並對照射箭在中國的千年歷史淵源（如西周六藝禮射、《考工記》六材複合弓、唐代武舉、明清《射學正宗》審固心法），回傳結構化 JSON。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: '專題標題（約10-18字，融合奧運榮耀與中華射藝傳承）',
              },
              dynastyEra: {
                type: Type.STRING,
                description: '涉及之奧運屆別與歷史時期（如：2008北京奧運首金 × 西周禮射傳承）',
              },
              passGeographyAndHistory: {
                type: Type.STRING,
                description: '中國射箭隊在奧運會上的真實輝煌戰績與經典人物故事（約75-115字）',
              },
              archeryTacticalInsight: {
                type: Type.STRING,
                description: '結合玩家此箭命中環數與風偏控制，講解射箭在中國的歷史演變（如《考工記》、六藝禮射、武舉審固）如何與現代奧運反曲弓技術呼應（約65-105字）',
              },
              classicalCitation: {
                type: Type.STRING,
                description: '引述中國古代射藝典籍名句（如《禮記·射義》、《論語》、《考工記》、《射學正宗》）或奧運冠軍精神格言（約20-45字）',
              },
            },
            required: [
              'headline',
              'dynastyEra',
              'passGeographyAndHistory',
              'archeryTacticalInsight',
              'classicalCitation',
            ],
          },
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(rawText);

      res.json({
        success: true,
        note: {
          id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          frontierPass,
          frontierRegion,
          rankTitle,
          bowName,
          targetDistance,
          ringName,
          score,
          timeOfDay,
          windName,
          arrowIndex,
          headline: parsed.headline || '五環穿楊：從北京首金到千年禮射',
          dynastyEra: parsed.dynastyEra || '2008北京奧運 × 中華射藝傳承',
          passGeographyAndHistory:
            parsed.passGeographyAndHistory ||
            '2008年北京奧運會，張娟娟在奧林匹克公園射箭場頂住瓢潑大雨，連克三位韓國名將奪得中國奧運史上首枚射箭金牌；歷屆奧運中國隊累計斬獲1金7銀2銅。',
          archeryTacticalInsight:
            parsed.archeryTacticalInsight ||
            '中國擁有兩萬八千年弓箭歷史，從西周君子「六藝」禮射到《考工記》六材複合反曲弓，古人強調的「內志正、外體直、審固乃發」至今仍是國家射箭隊在70米賽場抗風擊發的核心心法。',
          classicalCitation:
            parsed.classicalCitation ||
            '《禮記·射義》：「射者，進退周還必中禮；內志正，外體直，然後持弓矢審固。」',
          timestamp: Date.now(),
        },
      });
    } catch (error: unknown) {
      console.error('Gemini API Historical Note Error:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch historical note';
      res.status(500).json({
        success: false,
        error: message,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
