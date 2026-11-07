# Servidor do SMF local (só este PC; Supervisor, 06/11/2026): http://localhost:8780/manutencao/ lê os dados reais da planilha e não envia nada
# (SO_LER no js/02). Aberto pelo atalho “SMF local” da área de trabalho (pythonw, sem janela): liga o servidor, se ainda não estiver ligado, e abre
# o navegador. Manda o navegador não guardar cópia (no-store): um F5 sempre traz a mudança mais nova. Atende em 127.0.0.1 e em ::1 (o
# “localhost” do navegador pode ir por qualquer um dos dois); nada fica aberto para a rede. Erros vão para testes/saida/servidor_local.log.
import http.server, os, socket, sys, threading, webbrowser
AQUI = os.path.dirname(os.path.abspath(__file__)); LOG = os.path.join(AQUI, 'saida'); os.makedirs(LOG, exist_ok=True)
sys.stdout = sys.stderr = open(os.path.join(LOG, 'servidor_local.log'), 'a', encoding='utf-8', buffering=1)
os.chdir(os.path.dirname(AQUI))
URL = 'http://localhost:8780/manutencao/'

class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

class V4(http.server.ThreadingHTTPServer):
    allow_reuse_address = False   # no Windows, reaproveitar o endereço deixaria ligar dois servidores na mesma porta
class V6(V4):
    address_family = socket.AF_INET6

try:
    s4 = V4(('127.0.0.1', 8780), SemCache)
except OSError:   # já está ligado: só abre o navegador
    webbrowser.open(URL); sys.exit(0)
try:
    s6 = V6(('::1', 8780), SemCache)
    threading.Thread(target=s6.serve_forever, daemon=True).start()
except OSError as e:
    print('sem ::1:', e)
webbrowser.open(URL)
s4.serve_forever()
