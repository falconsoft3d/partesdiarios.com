import jinja2
from odoo import http
from odoo.http import request
from odoo.exceptions import UserError
from odoo import models, fields, _
import werkzeug
import werkzeug.utils
import json
import base64
from datetime import date
import logging
_logger = logging.getLogger(__name__)
from datetime import timedelta
import traceback

loader = jinja2.PackageLoader('odoo.addons.base_bim_2', 'web')
env = jinja2.Environment(loader=loader, autoescape=True)

class DiaryPartPwa(http.Controller):

    # http://localhost:8069/bim/diary-part-offline/pwa/login
    @http.route('/bim/diary-part-offline/pwa/login', methods=['POST'], type='json', auth='public', cors='*')
    def login_check(self, **kwargs):
        _logger.info("begin login_check")
        ok = False
        data = request.get_json_data()
        login = data.get('login')
        password = data.get('password')

        if login and password:
            hr_employee_id = http.request.env['hr.employee'].sudo().search([
                ('login', '=', login),
                ('password', '=', password),
            ], limit=1)

            if hr_employee_id:
                ok = True

        if ok:
            _logger.info(f"User {login} logged in successfully.")
            _logger.info(f"mployee: {hr_employee_id.name}")
            return {
                'status': 'ok',
                'name': hr_employee_id.name,
            }
        else:
            return {
                'status': 'error',
            }


    # http://localhost:8069/bim/diary-part-offline/pwa/change-password
    @http.route('/bim/diary-part-offline/pwa/change-password', methods=['POST'], type='json', auth='public', cors='*')
    def change_password(self, **kwargs):
        ok = False
        data = request.get_json_data()
        login = data.get('login')
        password = data.get('password')
        new_password = data.get('new-password')

        if login and password:
            hr_employee_id = http.request.env['hr.employee'].sudo().search([
                ('login', '=', login),
                ('password', '=', password),
            ], limit=1)

            if hr_employee_id:
                # Cambiar la contraseña
                hr_employee_id.sudo().write({
                    'password': new_password,
                })
                ok = True

        if ok:
            return {
                'status': 'ok',
            }
        else:
            return {
                'status': 'error',
            }


    # Download diary part for today in draft state
    # http://localhost:8069/bim/diary-part-offline/pwa/load-part
    @http.route('/bim/diary-part-offline/pwa/load-part', methods=['POST'], type='json', auth='public', cors='*')
    def load_part(self, **kwargs):
        _logger.info(":::::::::: begin load_part ::::::::::")
        data = request.get_json_data()
        login = data.get('login')
        password = data.get('password')

        if not login or not password:
            return {'status': 'error', 'message': 'Faltan credenciales'}

        # Buscar usuario por login y password (esto es solo para entorno controlado)
        hr_employee = request.env['hr.employee'].sudo().search([
            ('login', '=', login),
            ('password', '=', password)
        ], limit=1)

        _logger.info(f"hr_employee found: {hr_employee}")

        if not hr_employee:
            return {'status': 'error', 'message': 'Credenciales incorrectas'}

        # de la fecha de hoy restamos 3 dias para buscar partes recientes
        date_minus_3 = date.today() - timedelta(days=3)



        arr_search = [
            ('hr_employee_id', '=', hr_employee.id),
            ('date', '>' , date_minus_3),
            ('state_load', '=', 'sin_cargar')
        ]

        diary_parts_3 = request.env['diary.part'].sudo().search(arr_search,  order='date asc')

        count_arr_search = len(diary_parts_3)

        _logger.info(":::::::::: begin load_part ::::::::::")

        _logger.info(f"search domain: {arr_search}")

        diary_parts = request.env['diary.part'].sudo().search(arr_search, limit=1, order='date asc')

        # ordenados por fecha
        result_parts = []

        if diary_parts:
            part_id = diary_parts[-1]
        else:
            return {'status': 'error', 'message': 'No hay parte para hoy en estado borrador'}

        # Cargamos los PCP de la plantilla de recursos
        pcps = []
        for pcp in part_id.bim_resource_template_id.bim_pcp_ids:
            pcps.append({
                'bim_pcp_id': pcp.id,
                'bim_pcp_name': pcp.name,
            })
        pcps = sorted(pcps, key=lambda x: x['bim_pcp_name'])

        # vamos a buscar los empleados de la brigada asociada del parte
        employees = []

        for line in part_id.employee_lines_ids:
            employees.append({
                'hr_employee_id': line.hr_employee_id.id,
                'hr_employee_name': line.hr_employee_id.name,
            })

        employees = sorted(employees, key=lambda x: x['hr_employee_name'])

        equipments = []
        # equip_ids
        for line in part_id.equip_ids:
            equipments.append({
                'name': line.fleet_vehicle_id.name,
                'license_plate': line.fleet_vehicle_id.license_plate,
            })
        equipments = sorted(equipments, key=lambda x: x['license_plate'])

        all_equipments = []

        fleet_vehicle_ids = request.env['fleet.vehicle'].sudo().search([
            ('framework_contract_id', '=', part_id.framework_contract_id.id,)
        ])

        for fleet_vehicle in fleet_vehicle_ids:
            all_equipments.append({
                'name': fleet_vehicle.name,
                'license_plate': fleet_vehicle.license_plate,
            })



        # Vamos a buscar los presupuestos
        budgets = []
        for line in part_id.bim_resource_template_id.budget_ids:
            # buscamos la interface del presupuesto

            bim_interface_ids = request.env['bim.interface'].sudo().search([
                ('bim_budge_boq_id', '=', line.id),
            ], limit=1)

            arr_bim_interface = []
            if bim_interface_ids:
                for bim_interface in bim_interface_ids:
                    _logger.info(f"Found interface for budget {line.code}: {bim_interface.name}")
                    _bim_pcp_ids = part_id.bim_resource_template_id.bim_pcp_ids

                    arr_bim_interface.append({
                        'bim_interface_id': bim_interface.id,
                        'bim_interface_name': bim_interface.name,
                    })

                    bim_interface_line_ids = request.env['bim.interface.line'].sudo().search([('interface_id', '=', bim_interface.id)])
                    for bim_interface_line in bim_interface_line_ids:

                        arr_pcp = []
                        for _pcp in _bim_pcp_ids:
                            _logger.info(f"  Interface line for PCP { _pcp.name }: { bim_interface_line.id }")
                            arr_pcp.append({
                                'bim_pcp_id': _pcp.id,
                                'bim_pcp_name': _pcp.name,
                                'bim_pcp_description': _pcp.description,
                            })

                            # busco los desgloce de ese pcp
                            pcp_lines = request.env['bim.pcp.line'].sudo().search([
                                ('pcp_id', '=', _pcp.id),
                                ('bim_budget_id', '=', line.id)
                            ])

                            if not pcp_lines:
                                pcp_lines = request.env['bim.pcp.line'].sudo().search([('pcp_id', '=', _pcp.id)])

                            work_breakdown = []
                            if pcp_lines:
                                for pcp_line in pcp_lines:
                                    work_breakdown.append({
                                        'work_breakdown_id': pcp_line.work_breakdown_id.id,
                                        'work_breakdown_name': pcp_line.work_breakdown_id.name,
                                        'percentage': pcp_line.percentage,
                                    })

                            arr_pcp[-1]['work_breakdown'] = work_breakdown



                            work_package_id = bim_interface_line.work_package_id
                            if work_package_id:
                                _logger.info(f"Work package found: {work_package_id.name}")



                                elements = []
                                for linewp in work_package_id.line_ids:
                                    bim_element_id = linewp.bim_element_id
                                    _logger.info(f" Element: {bim_element_id.name}")

                                    if bim_element_id.execution_status not in ['executed']:
                                        elements.append({
                                            'bim_element_id': bim_element_id.id,
                                            'bim_element_name': bim_element_id.name,
                                            'execution_status': bim_element_id.execution_status,
                                        })

                                arr_pcp.append({
                                    'work_package_id': work_package_id.id,
                                    'work_package_name': work_package_id.name,
                                    'elements': elements,
                                })




                        arr_bim_interface.append({
                            'pcps': arr_pcp,
                        })


            budgets.append({
                'budget_id': line.id,
                'budget_name': line.code,
                'arr_bim_interface': arr_bim_interface,
            })

            _logger.info(">.>")
            _logger.info(budgets)
            _logger.info(">.>")

        budgets = sorted(budgets, key=lambda x: x['budget_name'])

        _logger.info(":::::::::: end load_part ::::::::::")

        _value = {
            'status': 'ok',
            'part_id': part_id.id,
            'date': str(part_id.date),
            'part_name': part_id.name,
            'pcps': pcps,
            'employees': employees,
            'equipments': equipments,
            'all_equipments': all_equipments,
            'budgets': budgets,
            'turno': part_id.employee_shift_id.name,
            'framework_contract_id': part_id.framework_contract_id.name,
            'responsable': hr_employee.name,
            'supervisor': part_id.sup_hr_employee_id.name,
            'diciplina': part_id.employee_discipline_id.name,
            'area': part_id.employee_area_id.name,
            'ubicacion': part_id.employee_location_id.name,
            'cant_partes_abiertos': count_arr_search,
            'cod_brigada' :  str(part_id.bim_resource_template_id.code),
            'name_brigada' :  str(part_id.bim_resource_template_id.name),
        }

        part_id.state_load = 'bajado'

        _logger.info(_value)

        return _value


    # Upload diary part for today in draft state y limpiaremos las lineas actuales y las sustituiremos por las que nos envian
    # http://localhost:8069/bim/diary-part-offline/pwa/save
    @http.route('/bim/diary-part-offline/pwa/save', methods=['POST'], type='json', auth='public', cors='*')
    def save_part(self, **kwargs):
        _logger.info("begin save_part")

        data = request.get_json_data()

        # escribo el data en el chat para debug
        _logger.info(f"Data received for save_part: {json.dumps(data)}")



        login = data.get('login')
        password = data.get('password')
        diary_part_data = data.get('diary_part')

        if not login or not password:
            return {'status': 'error', 'message': 'Faltan credenciales'}

        # Buscar usuario por login y password (esto es solo para entorno controlado)
        hr_employee = request.env['hr.employee'].sudo().search([
            ('login', '=', login),
            ('password', '=', password)
        ], limit=1)

        if not hr_employee:
            return {'status': 'error', 'message': 'Credenciales incorrectas'}

        if not diary_part_data:
            return {'status': 'error', 'message': 'Faltan datos del parte'}

        diary_part_id = diary_part_data.get('id')
        if not diary_part_id:
            return {'status': 'error', 'message': 'Falta ID del parte'}

        diary_part = request.env['diary.part'].sudo().search([
            ('id', '=', diary_part_id),
        ], limit=1)

        if not diary_part:
            return {'status': 'error', 'message': 'No se encontró el parte'}

        # Validar que las filas con error estén marcadas con I o que esté marcado NO trabajo
        state = diary_part_data.get('state', False)
        _logger.info(f"🔍 Estado del parte: {state}")
        
        if state != 'dont_work':
            employee_lines = diary_part_data.get('employee_lines_ids', [])
            _logger.info(f"🔍 Total de líneas de empleados recibidas: {len(employee_lines)}")
            
            errores_sin_marcar = []
            
            for idx, line_data in enumerate(employee_lines):
                tiene_error = line_data.get('has_error', False)
                tiene_inasistencia = line_data.get('i', False)
                hr_employee_id = line_data.get('hr_employee_id')
                hh = line_data.get('hh', 0)
                
                _logger.info(f"🔍 Línea {idx}: empleado_id={hr_employee_id}, hh={hh}, has_error={tiene_error}, i={tiene_inasistencia}")
                
                if tiene_error and not tiene_inasistencia and hr_employee_id:
                    # Buscar el nombre del empleado
                    employee = request.env['hr.employee'].sudo().browse(hr_employee_id)
                    if employee:
                        _logger.info(f"❌ Empleado con error sin marcar: {employee.name}")
                        errores_sin_marcar.append(employee.name)
            
            if errores_sin_marcar:
                empleados_texto = ', '.join(errores_sin_marcar)
                _logger.info(f"❌ Empleados con errores sin marcar: {empleados_texto}")
                return {
                    'status': 'error', 
                    'message': f'Los siguientes empleados tienen errores y deben marcarse como inasistencia (I) o marcar "NO trabajo": {empleados_texto}'
                }
            else:
                _logger.info("✅ No se encontraron empleados con errores sin marcar")

        # Limpiar las líneas actuales de empleados
        diary_part.sudo().employee_lines_ids.unlink()

        # Añadir las nuevas líneas de empleados
        new_employee_lines = []
        for line_data in diary_part_data.get('employee_lines_ids', []):
            new_line = {
                'hr_employee_id': line_data.get('hr_employee_id'),
                'bim_resource_id': line_data.get('bim_resource_id'),
                'bim_pcp_id': line_data.get('bim_pcp_id'),
                'hh': line_data.get('hh'),
                'budget_id': line_data.get('budget_id'),
                'non_attendance': line_data.get('i', False),
            }
            new_employee_lines.append((0, 0, new_line))

        # Limpiar y añadir líneas de equipos
        diary_part.sudo().equip_ids.unlink()
        new_equipment_lines = []

        for line_data in diary_part_data.get('equipment_lines_ids', []):
            # Buscar el equipo por placa
            license_plate = line_data.get('license_plate')
            fleet_vehicle = None
            if license_plate:
                fleet_vehicle = request.env['fleet.vehicle'].sudo().search([
                    ('license_plate', '=', license_plate)
                ], limit=1)

            if fleet_vehicle:
                new_equip_line = {
                    'fleet_vehicle_id': fleet_vehicle.id,
                    'product_id': fleet_vehicle.product_id.id if fleet_vehicle.product_id else False,
                    'budget_id': line_data.get('budget_id'),
                    'bim_pcp_id': line_data.get('bim_pcp_id'),
                    'qty': line_data.get('hh', 0.0),
                    'ref': license_plate,
                }
                new_equipment_lines.append((0, 0, new_equip_line))
            else:
                _logger.warning(f"No se encontró el equipo con placa: {license_plate}")

        # Limpiar y añadir líneas de producción
        diary_part.sudo().lines_ids.unlink()
        new_production_lines = []
        produccion_data = diary_part_data.get('produccion_lines_ids', [])
        _logger.info(f"Procesando {len(produccion_data)} líneas de producción")

        # Calcular el total de horas por budget_id y pcp_id de los empleados
        horas_por_budget_pcp = {}
        for emp_line in diary_part_data.get('employee_lines_ids', []):
            emp_budget_id = emp_line.get('budget_id')
            emp_pcp_id = emp_line.get('bim_pcp_id')
            emp_hh = emp_line.get('hh', 0.0)

            if emp_budget_id and emp_pcp_id and not emp_line.get('i', False):  # Solo si no es inasistencia
                key = f"{emp_budget_id}_{emp_pcp_id}"
                horas_por_budget_pcp[key] = horas_por_budget_pcp.get(key, 0.0) + emp_hh

        _logger.info(f"Horas calculadas por budget-pcp: {horas_por_budget_pcp}")

        for idx, line_data in enumerate(produccion_data):
            _logger.info(f"Línea producción {idx}: {line_data}")

            # Mapear los campos que vienen del frontend al nombre correcto del modelo
            budget_id = line_data.get('budget_id')
            pcp_id = line_data.get('pcp_id') or line_data.get('bim_pcp_id')  # Puede venir como pcp_id o bim_pcp_id
            element_id = line_data.get('element_id') or line_data.get('bim_element_id')
            work_breakdown_id = line_data.get('work_breakdown_id')
            cantidad = line_data.get('cantidad') or line_data.get('qty', 0.0)
            odt = line_data.get('odt', '')

            # Validar que al menos tenga budget_id y pcp_id
            if not budget_id or not pcp_id:
                _logger.warning(f"Línea de producción {idx} sin budget_id o pcp_id, se omite")
                continue

            # Calcular h_spent: si viene en el JSON lo usamos, sino calculamos del total de horas de empleados
            h_spent = line_data.get('h_spent', 0.0)
            if h_spent == 0.0:
                # Calcular proporcionalmente según la cantidad de líneas de producción con el mismo budget_id y pcp_id
                key = f"{budget_id}_{pcp_id}"
                total_horas_disponibles = horas_por_budget_pcp.get(key, 0.0)

                # Contar cuántas líneas de producción tienen el mismo budget_id y pcp_id
                lineas_mismo_budget_pcp = [l for l in produccion_data
                                          if l.get('budget_id') == budget_id
                                          and (l.get('pcp_id') or l.get('bim_pcp_id')) == pcp_id]
                num_lineas = len(lineas_mismo_budget_pcp)

                if num_lineas > 0 and total_horas_disponibles > 0:
                    h_spent = total_horas_disponibles / num_lineas
                    _logger.info(f"h_spent calculado: {h_spent} = {total_horas_disponibles} / {num_lineas}")

            new_prod_line = {
                'budget_id': budget_id,
                'bim_pcp_id': pcp_id,
                'work_breakdown_id': work_breakdown_id if work_breakdown_id else False,
                'bim_element_id': element_id if element_id else False,
                'qty': cantidad,
                'h_spent': h_spent,
                'status': line_data.get('status', 'in_process'),  # Default 'in_process' ya que se está reportando producción
                'obs': line_data.get('obs', ''),
                'odt': str(odt) if odt else '',
            }

            # Campos opcionales adicionales
            if line_data.get('work_package_id'):
                new_prod_line['work_package_id'] = line_data.get('work_package_id')

            new_production_lines.append((0, 0, new_prod_line))
            _logger.info(f"Línea de producción {idx} agregada: budget={budget_id}, pcp={pcp_id}, element={element_id}, qty={cantidad}, h_spent={h_spent}")

        _logger.info(f"Total líneas de producción a crear: {len(new_production_lines)}")

        # Limpiar y añadir horas perdidas de empleados
        diary_part.sudo().lost_hour_ids.unlink()
        new_lost_hour_lines = []
        horas_perdidas_data = diary_part_data.get('horas_perdidas_empleados_ids', [])
        _logger.info(f"Procesando {len(horas_perdidas_data)} líneas de horas perdidas")

        for idx, line_data in enumerate(horas_perdidas_data):
            _logger.info(f"Hora perdida {idx}: {line_data}")

            budget_id = line_data.get('budget_id')
            bim_pcp_id = line_data.get('bim_pcp_id')

            # Validar campos requeridos
            if not budget_id or not bim_pcp_id:
                _logger.warning(f"Hora perdida {idx} sin budget_id o bim_pcp_id, se omite")
                continue

            new_lost_hour = {
                'budget_id': budget_id,
                'bim_pcp_id': bim_pcp_id,
                'fbegin_hrs': line_data.get('hora_inicio', 0.0),
                'quantity': line_data.get('horas_perdidas', 0.0),
                'cant_person': line_data.get('cant_person', 1),
                'description': line_data.get('descripcion', ''),
            }

            # Buscar causa si viene como ID
            if line_data.get('cause_lost_hour_id'):
                new_lost_hour['cause_lost_hour_id'] = line_data.get('cause_lost_hour_id')
                _logger.info(f"Hora perdida {idx} - Causa por ID: {line_data.get('cause_lost_hour_id')}")

            # Si hay causa en texto, intentamos buscarla
            causa_texto = line_data.get('causa', '').strip()
            if causa_texto:
                _logger.info(f"Hora perdida {idx} - Buscando causa: '{causa_texto}'")
                cause = request.env['cause.lost.hour'].sudo().search([
                    ('name', '=', causa_texto)
                ], limit=1)

                if cause:
                    new_lost_hour['cause_lost_hour_id'] = cause.id
                    _logger.info(f"Hora perdida {idx} - Causa encontrada ID: {cause.id}")
                else:
                    _logger.warning(f"Hora perdida {idx} - Causa '{causa_texto}' no encontrada, se agregará a descripción")
                    # Agregar la causa a la descripción
                    if new_lost_hour['description']:
                        new_lost_hour['description'] = f"{causa_texto} - {new_lost_hour['description']}"
                    else:
                        new_lost_hour['description'] = causa_texto

            new_lost_hour_lines.append((0, 0, new_lost_hour))
            _logger.info(f"Hora perdida {idx} agregada: budget={budget_id}, pcp={bim_pcp_id}, cantidad={line_data.get('horas_perdidas')}")

        _logger.info(f"Total horas perdidas a crear: {len(new_lost_hour_lines)}")

        _logger.info(f"Preparando actualización con {len(new_employee_lines)} empleados, {len(new_equipment_lines)} equipos, {len(new_production_lines)} producción, {len(new_lost_hour_lines)} horas perdidas")

        # Preparar el diccionario de actualización solo con campos simples
        update_vals = {
            'state_load': 'cargado',
        }

        # Cargamos las notas
        observation = diary_part_data.get('observation', False)
        if observation:
            update_vals['observation'] = observation

        # si traes un dont_work lo pasas a estado dont_work
        state = diary_part_data.get('state', False)
        if state:
            if state == 'dont_work':
                update_vals['state'] = 'dont_work'

        # Procesar archivo adjunto
        file = diary_part_data.get('file', False)
        if file:
            file_name = file.get('name', 'attachment.txt')
            file_data = file.get('data', '')
            if file_data:
                # El file_data ya viene en base64 puro desde el frontend
                # NO necesitamos decodificarlo, Odoo lo maneja automáticamente
                update_vals['file'] = file_data
                update_vals['file_name'] = file_name  # ← IMPORTANTE: guardar el nombre
                _logger.info(f"Archivo adjunto: {file_name}, tamaño base64: {len(file_data)}")

        # Actualizar el parte con campos simples primero
        try:
            diary_part.sudo().write(update_vals)
            _logger.info(f"Parte diario {diary_part_id} - Campos simples actualizados")

            # Ahora crear las líneas de empleados
            _logger.info(f"Creando {len(new_employee_lines)} líneas de empleados...")
            for emp_vals in new_employee_lines:
                emp_vals_data = emp_vals[2]  # Extraer el diccionario de (0, 0, {datos})
                emp_vals_data['part_id'] = diary_part.id
                request.env['diary.part.employee.lines'].sudo().create(emp_vals_data)

            # Crear las líneas de equipos
            _logger.info(f"Creando {len(new_equipment_lines)} líneas de equipos...")
            for equip_vals in new_equipment_lines:
                equip_vals_data = equip_vals[2]
                equip_vals_data['part_id'] = diary_part.id
                request.env['diary.part.equip.lines'].sudo().create(equip_vals_data)

            # Crear las líneas de producción
            _logger.info(f"Creando {len(new_production_lines)} líneas de producción...")
            for prod_vals in new_production_lines:
                prod_vals_data = prod_vals[2]
                prod_vals_data['part_id'] = diary_part.id
                prod_line = request.env['diary.part.lines'].sudo().create(prod_vals_data)
                _logger.info(f"Línea de producción creada ID: {prod_line.id}")

            # Crear las líneas de horas perdidas
            _logger.info(f"Creando {len(new_lost_hour_lines)} líneas de horas perdidas...")
            for lost_vals in new_lost_hour_lines:
                lost_vals_data = lost_vals[2]
                lost_vals_data['diary_part_id'] = diary_part.id
                lost_line = request.env['lost.hour'].sudo().create(lost_vals_data)
                _logger.info(f"Hora perdida creada ID: {lost_line.id}")

            # Verificar las líneas creadas - Refrescar el registro
            diary_part.invalidate_recordset()  # Refrescar la cache en Odoo 17
            lines_count = len(diary_part.lines_ids)
            equip_count = len(diary_part.equip_ids)
            employee_count = len(diary_part.employee_lines_ids)
            lost_hour_count = len(diary_part.lost_hour_ids)

            # Paso el parte a cargado
            diary_part.sudo().to_loaded()



            _logger.info(f"✅ Verificación FINAL - Empleados: {employee_count}, Equipos: {equip_count}, Producción: {lines_count}, Horas Perdidas: {lost_hour_count}")

        except Exception as e:
            _logger.error(f"❌ Error al actualizar el parte diario: {str(e)}")
            import traceback
            _logger.error(traceback.format_exc())
            return {'status': 'error', 'message': f'Error al guardar: {str(e)}'}

        _logger.info("end save_part")

        return {'status': 'ok'}