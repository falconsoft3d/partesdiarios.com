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
        date_minus_3 = date.today() -  timedelta(days=3)

        arr_search = [
            ('hr_employee_id', '=', hr_employee.id),
            ('date', '>' , date_minus_3),
            ('state_load', '=', 'sin_cargar')
        ]

        count_arr_search = len(arr_search)

        _logger.info(f"search domain: {arr_search}")

        diary_parts = request.env['diary.part'].sudo().search(arr_search, limit=1, order='date asc')

        # ordenados por fecha
        result_parts = []

        if diary_parts:
            part_id = diary_parts[-1]
        else:
            # bajas el parte de hoy en estado borrador
            part_id = request.env['diary.part'].sudo().search([
                ('hr_employee_id', '=', hr_employee.id),
            ], limit=1, order='date desc')

            if not part_id:
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
        for line in part_id.bim_resource_template_id.line_ids:
            employees.append({
                'hr_employee_id': line.hr_employee_id.id,
                'hr_employee_name': line.hr_employee_id.name,
            })
        employees = sorted(employees, key=lambda x: x['hr_employee_name'])

        equipments = []
        for line in part_id.bim_resource_template_id.line_eq_ids:
            equipments.append({
                'name': line.fleet_vehicle_id.name,
                'license_plate': line.fleet_vehicle_id.license_plate,
            })
        equipments = sorted(equipments, key=lambda x: x['license_plate'])

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
            'budgets': budgets,
            'turno': part_id.employee_shift_id.name,
            'framework_contract_id': part_id.framework_contract_id.name,
            'responsable': hr_employee.name,
            'supervisor': part_id.sup_hr_employee_id.name,
            'diciplina': part_id.employee_discipline_id.name,
            'area': part_id.employee_area_id.name,
            'ubicacion': part_id.employee_location_id.name,
            'cant_partes_abiertos': count_arr_search,
        }

        part_id.state_load = 'bajado'

        # _logger.info(_value)

        return _value


    # Upload diary part for today in draft state y limpiaremos las lineas actuales y las sustituiremos por las que nos envian
    # http://localhost:8069/bim/diary-part-offline/pwa/save
    @http.route('/bim/diary-part-offline/pwa/save', methods=['POST'], type='json', auth='public', cors='*')
    def save_part(self, **kwargs):
        _logger.info("begin save_part")
        data = request.get_json_data()
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

        # Limpiar las líneas actuales
        diary_part.sudo().employee_lines_ids.unlink()

        # Añadir las nuevas líneas
        new_lines = []
        for line_data in diary_part_data.get('employee_lines_ids', []):
            new_line = {
                'hr_employee_id': line_data.get('hr_employee_id'),
                'bim_resource_id': line_data.get('bim_resource_id'),
                'bim_pcp_id': line_data.get('bim_pcp_id'),
                'hh': line_data.get('hh'),
                'budget_id': line_data.get('budget_id'),
                'non_attendance': line_data.get('i', False),
            }
            new_lines.append((0, 0, new_line))

        # Preparar el diccionario de actualización
        update_vals = {
            'employee_lines_ids': new_lines
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

        update_vals['state_load'] = 'cargado'


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

        # Procesar líneas de equipos
        equipment_lines_data = diary_part_data.get('equipment_lines_ids', [])
        if equipment_lines_data:
            _logger.info(f"Procesando {len(equipment_lines_data)} líneas de equipos")
            diary_part.sudo().equipment_lines_ids.unlink()
            equipment_lines = []
            for eq_line in equipment_lines_data:
                equipment_lines.append((0, 0, {
                    'equipment_name': eq_line.get('equipment_name'),
                    'license_plate': eq_line.get('license_plate'),
                    'budget_id': eq_line.get('budget_id'),
                    'bim_pcp_id': eq_line.get('bim_pcp_id'),
                    'hh': eq_line.get('hh'),
                }))
            update_vals['equipment_lines_ids'] = equipment_lines

        # Procesar líneas de producción
        produccion_lines_data = diary_part_data.get('produccion_lines_ids', [])
        if produccion_lines_data:
            _logger.info(f"Procesando {len(produccion_lines_data)} líneas de producción")
            diary_part.sudo().produccion_lines_ids.unlink()
            produccion_lines = []
            for prod_line in produccion_lines_data:
                produccion_lines.append((0, 0, {
                    'budget_id': prod_line.get('budget_id'),
                    'bim_interface_id': prod_line.get('interface_id'),
                    'bim_pcp_id': prod_line.get('pcp_id'),
                    'bim_element_id': prod_line.get('element_id'),
                    'odt': prod_line.get('odt'),
                    'work_breakdown_id': prod_line.get('work_breakdown_id'),
                    'cantidad': prod_line.get('cantidad'),
                }))
            update_vals['produccion_lines_ids'] = produccion_lines

        # Procesar horas perdidas de empleados
        horas_perdidas_emp_data = diary_part_data.get('horas_perdidas_empleados_ids', [])
        if horas_perdidas_emp_data:
            _logger.info(f"Procesando {len(horas_perdidas_emp_data)} líneas de horas perdidas empleados")
            diary_part.sudo().horas_perdidas_empleados_ids.unlink()
            horas_perdidas_emp_lines = []
            for hp_line in horas_perdidas_emp_data:
                horas_perdidas_emp_lines.append((0, 0, {
                    'hr_employee_id': hp_line.get('hr_employee_id'),
                    'budget_id': hp_line.get('budget_id'),
                    'bim_pcp_id': hp_line.get('bim_pcp_id'),
                    'hora_inicio': hp_line.get('hora_inicio'),
                    'horas_perdidas': hp_line.get('horas_perdidas'),
                    'causa': hp_line.get('causa'),
                    'descripcion': hp_line.get('descripcion'),
                }))
            update_vals['horas_perdidas_empleados_ids'] = horas_perdidas_emp_lines

        # Procesar horas perdidas de equipos
        horas_perdidas_eq_data = diary_part_data.get('horas_perdidas_equipos_ids', [])
        if horas_perdidas_eq_data:
            _logger.info(f"Procesando {len(horas_perdidas_eq_data)} líneas de horas perdidas equipos")
            diary_part.sudo().horas_perdidas_equipos_ids.unlink()
            horas_perdidas_eq_lines = []
            for hp_line in horas_perdidas_eq_data:
                horas_perdidas_eq_lines.append((0, 0, {
                    'license_plate': hp_line.get('license_plate'),
                    'budget_id': hp_line.get('budget_id'),
                    'bim_pcp_id': hp_line.get('bim_pcp_id'),
                    'hora_inicio': hp_line.get('hora_inicio'),
                    'horas_perdidas': hp_line.get('horas_perdidas'),
                    'causa': hp_line.get('causa'),
                    'descripcion': hp_line.get('descripcion'),
                }))
            update_vals['horas_perdidas_equipos_ids'] = horas_perdidas_eq_lines

        # Actualizar el parte con todos los valores
        diary_part.sudo().write(update_vals)
        _logger.info("end save_part")

        return {'status': 'ok'}