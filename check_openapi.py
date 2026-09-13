import sys
sys.path.insert(0, 'backend')
from app.main import app
from fastapi.openapi.utils import get_openapi

schema = get_openapi(title=app.title, version=app.version, routes=app.routes)
paths = schema.get('paths', {})
autotutor_path = '/api/v1/agent10/autotutor'

if autotutor_path in paths:
    post = paths[autotutor_path].get('post', {})
    print('POST /api/v1/agent10/autotutor: FOUND')
    print('  Summary:', post.get('summary', 'N/A'))
    req_body = post.get('requestBody', {})
    if req_body:
        content = req_body.get('content', {})
        schema_ref = content.get('application/json', {}).get('schema', {}).get('$ref', '')
        print('  Request schema ref:', schema_ref)
    resp_200 = post.get('responses', {}).get('200', {})
    resp_schema = resp_200.get('content', {}).get('application/json', {}).get('schema', {}).get('$ref', '')
    print('  Response 200 schema ref:', resp_schema)

    components = schema.get('components', {}).get('schemas', {})
    req_model = 'AutoTutorRequest'
    resp_model = 'AutoTutorResponse'
    print(f'  AutoTutorRequest in schema: {req_model in components}')
    print(f'  AutoTutorResponse in schema: {resp_model in components}')
    if req_model in components:
        print(f'  AutoTutorRequest fields: {list(components[req_model].get("properties", {}).keys())}')
    if resp_model in components:
        print(f'  AutoTutorResponse fields: {list(components[resp_model].get("properties", {}).keys())}')
else:
    print(f'MISSING: {autotutor_path} not in OpenAPI schema')
