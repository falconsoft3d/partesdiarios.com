import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Obtener los datos del request
    const body = await request.json();
    const { url, login, password } = body;

    console.log('=== LOGIN API ROUTE ===');
    console.log('URL recibida:', url);
    console.log('Login:', login);

    if (!url || !login || !password) {
      return NextResponse.json(
        { success: false, message: 'Faltan parámetros requeridos' },
        { status: 400 }
      );
    }

    // Construir la URL del endpoint de login
    const cleanUrl = url.replace(/\/$/, '');
    const endpoint = `${cleanUrl}/bim/diary-part-offline/pwa/login`;
    
    console.log('Endpoint construido:', endpoint);

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

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const data = await response.json();
    console.log('Response data:', data);
    
    // El backend de Odoo devuelve la respuesta en data.result
    const result = data.result || data;
    console.log('Result:', result);
    
    // Verificar la respuesta del backend
    if (result.status === 'ok') {
      return NextResponse.json({
        success: true,
        name: result.name,
        message: 'Login exitoso'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }

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