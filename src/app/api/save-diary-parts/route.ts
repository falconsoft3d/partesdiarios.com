import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, username, password, diary_part } = body;

    console.log('Saving diary parts request:', {
      url,
      username: username ? '[PROVIDED]' : '[MISSING]',
      password: password ? '[PROVIDED]' : '[MISSING]',
      diary_part_id: diary_part?.id,
      diary_part_lines: diary_part?.employee_lines_ids?.length
    });

    if (!url || !username || !password || !diary_part) {
      const missing = [];
      if (!url) missing.push('url');
      if (!username) missing.push('username');
      if (!password) missing.push('password');
      if (!diary_part) missing.push('diary_part');
      
      return NextResponse.json(
        { status: 'error', message: `Faltan parámetros requeridos: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    const requestBody = {
      login: username,
      password: password,
      diary_part: diary_part
    };

    console.log('Sending to Odoo:', {
      endpoint: `${url}/bim/diary-part-offline/pwa/save`,
      diary_part_id: diary_part.id,
      employee_lines_count: diary_part.employee_lines_ids?.length || 0
    });

    const response = await fetch(`${url}/bim/diary-part-offline/pwa/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Odoo response status:', response.status);

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Odoo response error:', responseText);
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseText}`);
    }

    const data = await response.json();
    console.log('Odoo response data:', data);
    
    // Si la respuesta es JSON-RPC, extraer el resultado
    if (data.jsonrpc && data.result !== undefined) {
      console.log('JSON-RPC response detected, extracting result:', data.result);
      return NextResponse.json(data.result);
    }
    
    // Si no es JSON-RPC, devolver tal cual
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error saving diary parts:', error);
    
    let errorMessage = 'Error de conexión al guardar los partes diarios';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { status: 'error', message: errorMessage },
      { status: 500 }
    );
  }
}