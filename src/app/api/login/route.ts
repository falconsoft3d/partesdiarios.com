import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del request
    const body = await request.json();
    const { url, login, password } = body;

    if (!url || !login || !password) {
      return NextResponse.json(
        { success: false, message: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Construir la URL del endpoint
    const cleanUrl = url.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/bim/diary-part-offline/pwa/load-part`;

    // Hacer la petición al servidor real
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        login: login,
        password: password
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Error del servidor: ${response.status} - ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      data: data,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('Error en proxy login:', error);
    
    let errorMessage = 'Error desconocido';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'No se pudo conectar al servidor. Verifica que esté ejecutándose.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}