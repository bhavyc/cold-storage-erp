import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const ledgers = await prisma.ledger.findMany({ include: { group: true } });
    let opAsset = 0;
    let opLiab = 0;
    
    let html = "<table border='1'><tr><th>Name</th><th>Grp</th><th>Mode</th><th>Bal</th><th>As Asset</th><th>As Liab</th></tr>";
    
    ledgers.forEach(l => {
      let a = 0;
      let b = 0;
      if (l.group.groupType === 'Asset') {
        if (l.openingMode === 'Debit') { opAsset += Number(l.openingBalance); a = Number(l.openingBalance); }
        else { opAsset -= Number(l.openingBalance); a = -Number(l.openingBalance); }
      } else if (l.group.groupType === 'Liability') {
        if (l.openingMode === 'Credit') { opLiab += Number(l.openingBalance); b = Number(l.openingBalance); }
        else { opLiab -= Number(l.openingBalance); b = -Number(l.openingBalance); }
      }
      
      html += `<tr><td>${l.name}</td><td>${l.group.groupType}</td><td>${l.openingMode}</td><td>${l.openingBalance}</td><td>${a}</td><td>${b}</td></tr>`;
    });

    html += `<tr><td colspan='4'>Total Op Asset</td><td colspan='2'>${opAsset}</td></tr>`;
    html += `<tr><td colspan='4'>Total Op Liab</td><td colspan='2'>${opLiab}</td></tr>`;
    html += `<tr><td colspan='4'>Difference</td><td colspan='2'>${opAsset - opLiab}</td></tr>`;
    html += "</table>";

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  } catch (error) {
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
