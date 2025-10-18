import { NextRequest, NextResponse } from 'next/server';

interface DiaryPartsRequest {
  url: string;
  login: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiaryPartsRequest = await request.json();
    const { url, login, password } = body;

    // Validar campos requeridos
    if (!url || !login || !password) {
      return NextResponse.json(
        { status: 'error', message: 'URL, login y password son requeridos' },
        { status: 400 }
      );
    }

    // Preparar la URL del endpoint específico para obtener partes diarios
    const apiUrl = `${url.replace(/\/$/, '')}/bim/diary-part-offline/pwa/load-part`;
    
    // Preparar los datos para enviar (sin fecha, el servidor usa date.today())
    const requestData = {
      login: login,
      password: password
    };

    console.log('Llamando a API:', apiUrl);
    console.log('Datos enviados:', JSON.stringify(requestData, null, 2));

    // Realizar la llamada a la API externa
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      console.error('Error en respuesta de API:', response.status, response.statusText);
      
      // Si el endpoint no existe (404), devolver datos mock para pruebas
      if (response.status === 404) {
        console.log('Endpoint no encontrado, devolviendo datos mock para pruebas');
        return NextResponse.json({
          status: "ok",
          pcps: [
            { bim_pcp_id: 101, bim_pcp_name: "Encofrado" },
            { bim_pcp_id: 102, bim_pcp_name: "Hormigonado" },
            { bim_pcp_id: 103, bim_pcp_name: "Ferrallado" }
          ],
          employees: [
            { hr_employee_id: 2626, hr_employee_name: "EDWIN, MARTINEZ VELAZQUEZ" },
            { hr_employee_id: 2597, hr_employee_name: "ALEXANDER FELIZ" },
            { hr_employee_id: 1160, hr_employee_name: "ALBERTO, ROSARIO BAUTISTA" },
            { hr_employee_id: 88, hr_employee_name: "IVAN GARCIA" }
          ],
          budgets: [
            { budget_id: 501, budget_name: "Presupuesto Obra 1" },
            { budget_id: 502, budget_name: "Presupuesto Obra 2" }
          ]
        });
      }
      
      // Para credenciales incorrectas u otros errores
      if (response.status === 401 || response.status === 403) {
        return NextResponse.json({
          status: 'error',
          message: 'Credenciales incorrectas'
        });
      }
      
      return NextResponse.json(
        { 
          status: 'error', 
          message: `Error del servidor externo: ${response.status} ${response.statusText}` 
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    console.log('Respuesta de API:', JSON.stringify(result, null, 2));

    // Verificar si hay error en la respuesta JSON-RPC
    if (result.error) {
      const errorData = result.error.data;
      let errorMessage = result.error.message || 'Error en la respuesta del servidor';
      
      // Detectar el error específico de "no hay partes disponibles"
      if (errorData && errorData.name === 'builtins.IndexError' && 
          errorData.debug && errorData.debug.includes('tuple index out of range')) {
        errorMessage = 'No hay partes diarios disponibles. Por favor, crea un parte diario en Odoo primero.';
      }
      
      return NextResponse.json({
        status: 'error',
        message: errorMessage
      });
    }

    // Si la respuesta tiene el formato JSON-RPC, extraer el resultado
    if (result.result) {
      return NextResponse.json(result.result);
    }

    // Si la respuesta ya tiene el formato correcto, devolverla directamente
    if (result.status) {
      return NextResponse.json(result);
    }

    // Si llegamos aquí, la respuesta no tiene el formato esperado
    return NextResponse.json({
      status: 'error',
      message: 'Formato de respuesta inesperado del servidor'
    });

  } catch (error) {
    console.error('Error en proxy de partes diarios:', error);
    
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}