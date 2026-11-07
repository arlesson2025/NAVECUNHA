# Servidor do SMF local (só este PC; Supervisor, 06/11/2026): http://localhost:8780/manutencao/ lê os dados reais da planilha e não envia nada
# (SO_LER no js/02). Roda sem janela (pythonw), ligado pelo atalho “SMF local” da área de trabalho. Manda o navegador não guardar cópia
# (no-store): um F5 sempre traz a mudança mais nova. Sem janela não há onde escrever o registro dos acessos, então ele vai para o nada.
# Atende em 127.0.0.1 e em ::1 (o “localhost” do navegador pode ir por qualquer um dos dois); nada fica aberto para a rede.
import http.server, os, socket, sys, threading
sys.stdout = sys.stderr = open(os.devnull, 'w')
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class SemCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass

class V6(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

try:
    s6 = V6(('::1', 8780), SemCache)
    threading.Thread(target=s6.serve_forever, daemon=True).start()
except OSError:
    pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8780), SemCache).serve_forever()
