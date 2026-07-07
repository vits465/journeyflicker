import express from "express";
import PDFDocument from "pdfkit";
import path from "node:path";
import fs from "node:fs";
import { Tour as TourModel } from "../db/models/index.js";

export const router = express.Router();

router.get("/tour/:id", async (req, res) => {
  try {
    const tour = await TourModel.findOne({ id: req.params.id }).lean();
    if (!tour) return res.status(404).json({ error: "Tour not found" });

    // Initialize PDF Document
    const doc = new PDFDocument({ margin: 50 });
    const filename = `JourneyFlicker_Dossier_${tour.name.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    // Header styling: Premium unified logo
    const logoWidth = 220;
    const startX = (doc.page.width - logoWidth) / 2;
    const logoY = doc.y;

    const faviconPath = path.join(process.cwd(), "JFfavicon/favicon-96x96.png");
    if (fs.existsSync(faviconPath)) {
      doc.image(faviconPath, startX, logoY, { width: 24, height: 24 });
    }

    doc.strokeColor("#C8A84B")
       .lineWidth(1)
       .moveTo(startX + 34, logoY)
       .lineTo(startX + 34, logoY + 24)
       .stroke();

    doc.fillColor("#000000")
       .fontSize(18)
       .text("JourneyFlicker", startX + 44, logoY + 3, { characterSpacing: 2 });

    doc.y = logoY + 30; // reset y coordinate below the logo block

    doc.moveDown(0.5);
    doc.fillColor("#666666")
       .fontSize(10)
       .text("Global Intelligence Bureau", { align: "center", characterSpacing: 4 });
    
    doc.moveDown(2);

    // Tour Title
    doc.fillColor("#000000")
       .fontSize(28)
       .text(tour.name, { align: "center" });

    doc.fillColor("#4a4a4a")
       .fontSize(12)
       .text(`${tour.days} Days • ${tour.region} • ${tour.category}`, { align: "center" });
    
    doc.moveDown(2);

    // Overview
    doc.fillColor("#000000")
       .fontSize(16)
       .text("Expedition Overview", { underline: true });
    
    doc.moveDown(0.5);

    doc.fillColor("#333333")
       .fontSize(12)
       .text(tour.overviewDescription || tour.overviewExtended || "No overview provided.", {
         align: "justify",
         lineGap: 4
       });

    doc.moveDown(2);

    // Itinerary
    if (tour.itinerary && tour.itinerary.length > 0) {
      doc.addPage();
      doc.fillColor("#000000")
         .fontSize(20)
         .text("Daily Dossier", { align: "center" });
      doc.moveDown(2);

      tour.itinerary.forEach((day, index) => {
        doc.fillColor("#C8A84B")
           .fontSize(14)
           .text(`Day ${index + 1}: ${day.title}`);
        
        doc.fillColor("#555555")
           .fontSize(11)
           .text(`Schedule: ${day.schedule || 'N/A'} | Meals: ${day.meals || 'N/A'}`);
        
        doc.moveDown(0.5);

        doc.fillColor("#333333")
           .fontSize(10)
           .text(day.description, { align: "justify", lineGap: 2 });
        
        doc.moveDown(1.5);
      });
    }

    doc.addPage();
    doc.fillColor("#000000")
       .fontSize(16)
       .text("Contact The Support Board", { underline: true });
    
    doc.moveDown(1);

    doc.fillColor("#333333")
       .fontSize(12)
       .text("Email: tushar@journeyflicker.com | pashv@journeyflicker.com", { lineGap: 5 })
       .text("Phone: +91 98792 68811 | +91 97266 98987 | 0261 3564717", { lineGap: 5 })
       .text("Address: Raj Victoriya, 103, near Samarth Circle, Adajan Gam, Adajan, Surat, Gujarat 395009", { lineGap: 5 });

    // Footer
    doc.fillColor("#C8A84B")
       .fontSize(10)
       .text("© JourneyFlicker. All rights reserved.", 50, doc.page.height - 50, { align: "center" });

    doc.end();
  } catch (error) {
    console.error("[PDF Error]", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to generate PDF dossier" });
    }
  }
});
