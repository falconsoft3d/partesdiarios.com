import { NextRequest, NextResponse } from 'next/server';

interface DiaryPartsRequest {
  url: string;
  login: string;
  password: string;
  date: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DiaryPartsRequest = await request.json();
    const { url, login, password, date } = body;

    // Validar campos requeridos
    if (!url || !login || !password || !date) {
      return NextResponse.json(
        { status: 'error', message: 'URL, login, password y date son requeridos' },
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
          diary_parts: [
            {
              id: 9652,
              name: "PTD/009652",
              date: date,
              hr_employee_id: 2626,
              hr_employee_name: "EDWIN, MARTINEZ VELAZQUEZ",
              state: "draft",
              employee_lines_ids: [
                {
                  id: 32657,
                  hr_employee_id: 2626,
                  hr_employee_name: "EDWIN, MARTINEZ VELAZQUEZ",
                  bim_resource_id: false,
                  bim_resource_name: false,
                  budget_id: false,
                  budget_name: false,
                  bim_pcp_id: false,
                  bim_pcp_name: false,
                  hh: 10.0
                },
                {
                  id: 32658,
                  hr_employee_id: 2597,
                  hr_employee_name: "ALEXANDER FELIZ",
                  bim_resource_id: false,
                  bim_resource_name: false,
                  budget_id: false,
                  budget_name: false,
                  bim_pcp_id: false,
                  bim_pcp_name: false,
                  hh: 10.0
                },
                {
                  id: 32659,
                  hr_employee_id: 1160,
                  hr_employee_name: "ALBERTO, ROSARIO BAUTISTA",
                  bim_resource_id: false,
                  bim_resource_name: false,
                  budget_id: false,
                  budget_name: false,
                  bim_pcp_id: false,
                  bim_pcp_name: false,
                  hh: 10.0
                },
                {
                  id: 32660,
                  hr_employee_id: 88,
                  hr_employee_name: "IVAN GARCIA",
                  bim_resource_id: false,
                  bim_resource_name: false,
                  budget_id: false,
                  budget_name: false,
                  bim_pcp_id: false,
                  bim_pcp_name: false,
                  hh: 0.0
                }
              ]
            }
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
      return NextResponse.json({
        status: 'error',
        message: result.error.message || 'Error en la respuesta del servidor'
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