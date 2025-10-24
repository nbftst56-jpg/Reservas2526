(function() {
    // VARIÁVEIS GLOBAIS
    let clientes = [], dadosFinanceiros = [], dadosLimpeza = [];
    // *** INÍCIO: MODIFICAÇÃO (FEATURE 2) - Variável de rastreamento ***
    let ultimaAcaoLimpeza = { acao: null, data: null, unidade: null };
    // *** FIM: MODIFICAÇÃO (FEATURE 2) ***
    let clienteSelecionado = null;
    let segurancaAtivada = false;
    let mesAtualIndex = 0;

    const LOCAL_STORAGE_KEY_RESERVAS = 'dadosReservasTemporada2025_2026';
    const LOCAL_STORAGE_KEY_CLIENTES = 'clientesTemporada2025_2026';
    const LOCAL_STORAGE_KEY_FINANCEIRO = 'financeiroTemporada2025_2026';
    const LOCAL_STORAGE_KEY_LIMPEZA = 'limpezaTemporada2025_2026';

    // CONFIGURAÇÕES
    const unidades = ["UN01", "UN02", "UN03"];
    const meses = [
        { nome: "Novembro", dias: 30, ano: 2025 },
        { nome: "Dezembro", dias: 31, ano: 2025 },
        { nome: "Janeiro", dias: 31, ano: 2026 },
        { nome: "Fevereiro", dias: 28, ano: 2026 },
        { nome: "Março", dias: 31, ano: 2026 },
        { nome: "Abril", dias: 30, ano: 2026 },
        { nome: "Maio", dias: 31, ano: 2026 }
    ];

    // --- FUNÇÕES ---

    // *** FUNÇÃO DO MENU HAMBÚRGUER ***
    function toggleMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.getElementById('overlay');
        if (sidebar) sidebar.classList.toggle('ativo');
        if (overlay) overlay.classList.toggle('ativo');
    }

    function showNotification(message, type = "info") {
        const notificationDiv = document.createElement("div");
        notificationDiv.textContent = message;
        notificationDiv.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 10px 20px; border-radius: 8px; color: white; z-index: 3000; font-family: 'Poppins', sans-serif; background-color: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};`;
        document.body.appendChild(notificationDiv);
        setTimeout(() => notificationDiv.remove(), 3000);
    }

    function atualizarVisualizacaoMes() {
        const mesInfo = meses[mesAtualIndex];
        const mesAtualDisplay = document.getElementById('mesAtualDisplay');
        const mesAnteriorBtn = document.getElementById('mesAnteriorBtn');
        const mesProximoBtn = document.getElementById('mesProximoBtn');
        if (!mesAtualDisplay || !mesAnteriorBtn || !mesProximoBtn || !mesInfo) return;
        mesAtualDisplay.textContent = `${mesInfo.nome} ${mesInfo.ano}`;
        document.querySelectorAll('.unidade-coluna .mes').forEach(mesDiv => {
            if (mesDiv && mesDiv.dataset) {
                 mesDiv.style.display = mesDiv.dataset.mes === mesInfo.nome ? 'block' : 'none';
            }
        });
        mesAnteriorBtn.disabled = mesAtualIndex === 0;
        mesProximoBtn.disabled = mesAtualIndex === meses.length - 1;
    }
    
    function criarCalendario() {
        const container = document.getElementById("calendario-container");
        if (!container) return; 
        container.innerHTML = '';
        unidades.forEach(unidade => {
            const uDiv = document.createElement("div");
            uDiv.classList.add("unidade-coluna");
            uDiv.innerHTML = `<h2>${unidade}</h2>`;
            meses.forEach(mes => {
                const mDiv = document.createElement("div");
                mDiv.classList.add("mes");
                mDiv.dataset.mes = mes.nome;
                const dCont = document.createElement("div");
                dCont.classList.add("dias");
                for (let i = 1; i <= mes.dias; i++) {
                    const dDiv = document.createElement("div");
                    dDiv.classList.add("dia");
                    dDiv.innerHTML = `<strong>${i}</strong>`;
                    Object.assign(dDiv.dataset, { dia: i, mes: mes.nome, ano: mes.ano, unidade: unidade });
                    dCont.appendChild(dDiv);
                }
                mDiv.appendChild(dCont);
                uDiv.appendChild(mDiv);
            });
            container.appendChild(uDiv);
        });
        atualizarVisualizacaoMes(); 
    }

    function aplicarFiltros() {
        const clienteSelect = document.getElementById("clienteSelect");
        if (!clienteSelect) return;
        const clienteFiltro = clienteSelect.value;
        document.querySelectorAll('.dia').forEach(diaDiv => {
            const { entrada, saida, hospedado } = diaDiv.dataset;
            const clientesDoDia = [entrada, saida, hospedado].filter(Boolean);
            let matchCliente = !clienteFiltro || clientesDoDia.includes(clienteFiltro);
            if (matchCliente) {
                diaDiv.classList.remove('filtered-out');
                if (clienteFiltro) diaDiv.classList.add("filtered-in");
                else diaDiv.classList.remove("filtered-in");
            } else {
                diaDiv.classList.add('filtered-out');
                diaDiv.classList.remove('filtered-in');
            }
        });
    }
    
    function abrirModalCliente(modo, cliente = null) {
        const formCliente = document.getElementById('formCliente');
        const modalCliente = document.getElementById('modalCliente');
        if (!formCliente || !modalCliente) return;
        formCliente.reset();
        const modalClienteTitulo = document.getElementById('modalClienteTitulo');
        const salvarClienteBtn = document.getElementById('salvarClienteBtn');
        const clienteOriginalNomeInput = document.getElementById('clienteOriginalNomeInput');
        const clienteNomeInput = document.getElementById('clienteNomeInput');
        const clienteWhatsInput = document.getElementById('clienteWhatsInput');
        const clientePaisInput = document.getElementById('clientePaisInput');
        const clienteTempoInput = document.getElementById('clienteTempoInput');
        const clienteUnidadeInput = document.getElementById('clienteUnidadeInput');
        const clienteStatusInput = document.getElementById('clienteStatusInput');
        
        if (modo === 'editar' && cliente) {
            modalClienteTitulo.textContent = 'Editar Cliente';
            salvarClienteBtn.textContent = 'Salvar Alterações';
            clienteOriginalNomeInput.value = cliente.nome;
            clienteNomeInput.value = cliente.nome;
            clienteWhatsInput.value = cliente.whats || '';
            clientePaisInput.value = cliente.pais || '';
            clienteTempoInput.value = cliente.tempo || '';
            clienteUnidadeInput.value = cliente.unidade || '';
            clienteStatusInput.value = cliente.status || '';
        } else {
            modalClienteTitulo.textContent = 'Adicionar Novo Cliente';
            salvarClienteBtn.textContent = 'Adicionar Cliente';
            clienteOriginalNomeInput.value = '';
        }
        modalCliente.style.display = 'flex';
    }

    function handleFormClienteSubmit(event) {
        event.preventDefault();
        const nome = document.getElementById('clienteNomeInput').value.trim();
        if (!nome) { showNotification("O nome do cliente é obrigatório.", "error"); return; }
        const nomeOriginal = document.getElementById('clienteOriginalNomeInput').value;
        if (clientes.some(c => c.nome.toLowerCase() === nome.toLowerCase() && c.nome !== nomeOriginal)) { showNotification("Já existe um cliente com este nome.", "error"); return; }
        const dadosCliente = {
            nome: nome,
            whats: document.getElementById('clienteWhatsInput').value.trim(),
            pais: document.getElementById('clientePaisInput').value.trim(),
            tempo: document.getElementById('clienteTempoInput').value.trim(),
            unidade: document.getElementById('clienteUnidadeInput').value.trim(),
            status: document.getElementById('clienteStatusInput').value.trim()
        };
        if (nomeOriginal) {
            const index = clientes.findIndex(c => c.nome === nomeOriginal);
            if (index > -1) clientes[index] = dadosCliente;
        } else {
            clientes.push(dadosCliente);
        }
        preencherListaClientes(clientes);
        const clienteSelect = document.getElementById("clienteSelect");
        if(clienteSelect) clienteSelect.value = dadosCliente.nome;
        clienteSelecionado = dadosCliente.nome;
        
        const editarClienteBtn = document.getElementById('editarClienteBtn');
        const removerClienteBtn = document.getElementById('removerClienteBtn');
        const gerenciarFinanceiroBtn = document.getElementById('gerenciarFinanceiroBtn');
        if(editarClienteBtn) editarClienteBtn.disabled = false;
        if(removerClienteBtn) removerClienteBtn.disabled = false;
        if(gerenciarFinanceiroBtn) gerenciarFinanceiroBtn.disabled = false;
        
        aplicarFiltros();
        salvarDadosLocalmente();
        const modalCliente = document.getElementById('modalCliente');
        if(modalCliente) modalCliente.style.display = 'none';
    }

    function preencherListaClientes(lista) {
        const clienteSelect = document.getElementById("clienteSelect");
        const filtroResvCheckbox = document.getElementById("filtroResvCheckbox");
        if (!clienteSelect || !filtroResvCheckbox) return;

        const valorAnterior = clienteSelect.value;
        clienteSelect.innerHTML = "<option value=\"\">-- Todos os Clientes --</option>";
        let listaFiltrada = filtroResvCheckbox.checked ? lista.filter(c => c.status && c.status.trim().toUpperCase() === 'RESV') : lista;
        listaFiltrada.sort((a, b) => a.nome.localeCompare(b.nome)).forEach(c => {
            const option = document.createElement("option");
            option.value = c.nome;
            option.textContent = `${c.nome} (${c.whats || 's/n'})`;
            clienteSelect.appendChild(option);
        });
        if ([...clienteSelect.options].some(opt => opt.value === valorAnterior)) {
            clienteSelect.value = valorAnterior;
        }
    }

    function coletarDadosDeReservas() {
        const reservas = [];
        document.querySelectorAll('.dia').forEach(dia => {
            const { entrada, saida, hospedado, unidade, mes, ano, dia: diaNum } = dia.dataset;
            if (entrada || saida || hospedado) {
                reservas.push({ unidade, mes, ano, dia: diaNum, entrada: entrada || null, saida: saida || null, hospedado: hospedado || null });
            }
        });
        return reservas;
    }
    
    function baixarArquivo(conteudo, nomeArquivo, tipo = 'text/plain') {
        try {
            const blob = new Blob([conteudo], { type: tipo });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = nomeArquivo;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erro ao baixar arquivo:", error);
            showNotification("Ocorreu um erro ao tentar gerar o arquivo.", "error");
        }
    }

    function salvarDadosLocalmente() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_RESERVAS, JSON.stringify(coletarDadosDeReservas()));
            localStorage.setItem(LOCAL_STORAGE_KEY_CLIENTES, JSON.stringify(clientes));
            localStorage.setItem(LOCAL_STORAGE_KEY_FINANCEIRO, JSON.stringify(dadosFinanceiros));
            // Salva dados de limpeza COM a flag 'editada' para persistência
            localStorage.setItem(LOCAL_STORAGE_KEY_LIMPEZA, JSON.stringify(dadosLimpeza));
            showNotification("Progresso salvo localmente!", "success");
        } catch (error) {
            console.error("Erro ao salvar dados localmente:", error);
            showNotification("Erro ao salvar dados localmente.", "error");
        }
    }

    function carregarDadosLocais() {
        const clientesSalvos = localStorage.getItem(LOCAL_STORAGE_KEY_CLIENTES);
        if (clientesSalvos) { clientes = JSON.parse(clientesSalvos); preencherListaClientes(clientes); }
        const reservasSalvas = localStorage.getItem(LOCAL_STORAGE_KEY_RESERVAS);
        if (reservasSalvas) {
            JSON.parse(reservasSalvas).forEach(reserva => {
                const diaDiv = document.querySelector(`.dia[data-unidade="${reserva.unidade}"][data-mes="${reserva.mes}"][data-dia="${reserva.dia}"]`);
                if (diaDiv) {
                    diaDiv.dataset.entrada = reserva.entrada || "";
                    diaDiv.dataset.saida = reserva.saida || "";
                    diaDiv.dataset.hospedado = reserva.hospedado || "";
                    atualizarVisual(diaDiv);
                }
            });
        }
        const financasSalvas = localStorage.getItem(LOCAL_STORAGE_KEY_FINANCEIRO);
        if (financasSalvas) {
            dadosFinanceiros = JSON.parse(financasSalvas);
            // Remove registros financeiros inválidos (sem idReserva)
            dadosFinanceiros = dadosFinanceiros.filter(f => f.idReserva && f.idReserva.trim() !== '');
        }
        
        const limpezaSalva = localStorage.getItem(LOCAL_STORAGE_KEY_LIMPEZA);
        if (limpezaSalva) {
            dadosLimpeza = JSON.parse(limpezaSalva);
            // Remove registros inválidos (datas NaN ou tipos incorretos)
            dadosLimpeza = dadosLimpeza.filter(l => {
                return l.data && l.data !== 'NaN-NaN-NaN' && !l.data.includes('NaN') && l.tipo !== 'Limpeza de Entrada';
            });
        }

         const autoBackupToggle = document.getElementById('autoBackupToggle');
         const autoBackupPref = localStorage.getItem('autoBackupEnabled');
        if (autoBackupPref === 'true' && autoBackupToggle) {
            autoBackupToggle.checked = true;
        }
    }
    
    function sincronizarLimpezasComSaidas() {
        // Percorre todos os dias do calendário e cria tarefas de limpeza para saídas que não têm
        document.querySelectorAll('.dia').forEach(diaDiv => {
            const { saida, unidade, ano, mes, dia } = diaDiv.dataset;
            if (saida) {
                const dataFormatada = formatarDataParaID(ano, mes, dia);
                const idLimpeza = `${unidade}-${dataFormatada}`;
                // Verifica se já existe uma tarefa de limpeza para esta saída
                const tarefaExistente = dadosLimpeza.find(l => l.id === idLimpeza && l.tipo === "Faxina de Saída");
                if (!tarefaExistente) {
                    const novaTarefa = {
                        id: idLimpeza,
                        unidade: unidade,
                        data: dataFormatada,
                        tipo: "Faxina de Saída",
                        status: "Pendente",
                        editada: false // Novas tarefas não são editadas por padrão
                    };
                    dadosLimpeza.push(novaTarefa);
                }
                // Se já existe, preserva a flag 'editada' existente
            }
        });
        // Salva após sincronizar para persistir as mudanças
        salvarDadosLocalmente();
    }
    
    function limparDadosLocais() {
        if (confirm("Você tem certeza que deseja apagar TODOS os dados (reservas, clientes, finanças)? Esta ação não pode ser desfeita.")) {
            localStorage.clear();
            location.reload();
        }
    }
    
    function importarListaClientes(texto) {
        try {
            const linhas = texto.split("\n").filter(l => l.trim());
            const novosClientes = linhas.map(linha => {
                const [nome, whats, pais, tempo, unidade, status] = linha.split("-");
                return { nome: nome.trim(), whats, pais, tempo, unidade, status };
            });
            novosClientes.forEach(nc => {
                if (!clientes.some(c => c.nome === nc.nome)) clientes.push(nc);
            });
            preencherListaClientes(clientes);
            salvarDadosLocalmente(); // Sempre salva após importar clientes
            showNotification("Clientes importados com sucesso!", "success");
        } catch (err) {
            showNotification("Erro ao importar clientes.", "error");
        }
    }

    // --- NOVAS FUNÇÕES DE IMPORT/EXPORT ---
    function exportarBackupCompleto() {
        const backupData = {
            clientes: clientes,
            reservas: coletarDadosDeReservas(),
            financeiro: dadosFinanceiros,
            limpeza: dadosLimpeza
        };
        const conteudo = JSON.stringify(backupData, null, 2);
        baixarArquivo(conteudo, 'backup_completo_reservas.json', 'application/json');
    }

    function importarBackupCompleto(jsonString) {
        try {
            const backupData = JSON.parse(jsonString);
            if (!backupData || typeof backupData !== 'object') throw new Error("Arquivo JSON inválido.");

            if (backupData.clientes && Array.isArray(backupData.clientes)) {
                clientes = backupData.clientes;
                preencherListaClientes(clientes);
            } else {
                clientes = []; 
                preencherListaClientes(clientes);
            }

            document.querySelectorAll('.dia').forEach(dia => {
                dia.dataset.entrada = "";
                dia.dataset.saida = "";
                dia.dataset.hospedado = "";
                atualizarVisual(dia);
            });

            if (backupData.reservas && Array.isArray(backupData.reservas)) {
                backupData.reservas.forEach(reserva => {
                    const diaDiv = document.querySelector(`.dia[data-unidade="${reserva.unidade}"][data-mes="${reserva.mes}"][data-dia="${reserva.dia}"]`);
                    if(diaDiv){
                        Object.assign(diaDiv.dataset, { entrada: reserva.entrada || "", saida: reserva.saida || "", hospedado: reserva.hospedado || "" });
                        atualizarVisual(diaDiv);
                    }
                });
            }

            if (backupData.financeiro && Array.isArray(backupData.financeiro)) {
                dadosFinanceiros = backupData.financeiro;
            } else {
                dadosFinanceiros = []; 
            }
            
            if (backupData.limpeza && Array.isArray(backupData.limpeza)) {
                dadosLimpeza = backupData.limpeza;
            } else {
                dadosLimpeza = [];
            }

            sincronizarLimpezasComSaidas(); // Sincroniza limpezas após importar
            salvarDadosLocalmente(); 
            aplicarFiltros();
            showNotification("Backup completo importado com sucesso!", "success");

        } catch(err) {
            console.error("Erro ao importar backup:", err);
            showNotification("Erro ao importar backup completo. Verifique o arquivo JSON.", "error");
        }
    }
    
    function exportarFinanceiroJSON() {
        if (dadosFinanceiros.length === 0) return showNotification("Nenhum dado financeiro para exportar.", "info");
        const conteudo = JSON.stringify(dadosFinanceiros, null, 2);
        baixarArquivo(conteudo, 'financeiro_exportado.json', 'application/json');
    }
    // ------------------------------------
    
    function exportarListaClientes() {
        if (clientes.length === 0) return showNotification("Nenhum cliente para exportar.", "info");
        const conteudo = clientes.map(c => `${c.nome}-${c.whats || ''}-${c.pais || ''}-${c.tempo || ''}-${c.unidade || ''}-${c.status || ''}`).join('\n');
        baixarArquivo(conteudo, 'clientes_exportados.txt');
    }

    function exportarReservasTXT() {
        const dados = coletarDadosDeReservas();
        if (dados.length === 0) return showNotification("Nenhuma reserva para exportar.", "info");
        let conteudo = "UNIDADE;DATA;TIPO;CLIENTE\n";
        dados.forEach(r => {
            const data = `${r.ano}-${String(meses.findIndex(m => m.nome === r.mes) + 1).padStart(2, '0')}-${String(r.dia).padStart(2, '0')}`;
            if (r.hospedado) conteudo += `${r.unidade};${data};HOSPEDADO;${r.hospedado}\n`;
            if (r.entrada) conteudo += `${r.unidade};${data};ENTRADA;${r.entrada}\n`;
            if (r.saida) conteudo += `${r.unidade};${data};SAIDA;${r.saida}\n`;
        });
        baixarArquivo(conteudo, 'reservas_exportadas.txt');
    }

    function atualizarVisual(dia) {
        if (!dia || !dia.dataset) return; 
        const { dia: d, entrada, saida, hospedado } = dia.dataset;
        dia.className = "dia"; 
        let content = `<strong>${d}</strong>`;
        const getInfo = (cliNome) => {
            const cli = clientes.find(c => c.nome === cliNome);
            return cli ? `${cli.nome.slice(0, 3).toUpperCase()}-${cli.whats ? cli.whats.slice(-4) : 'S/N'}` : '';
        };
        if (hospedado) { dia.classList.add("hospedado"); content = `<strong>${d} <i class="bi bi-check-circle-fill icon-hospedado"></i></strong><div>${getInfo(hospedado)}-H</div>`; } 
        else if (entrada && saida) { dia.classList.add("dupla"); content = `<strong>${d} <i class="bi bi-arrow-repeat icon-troca"></i></strong><div><i class="bi bi-box-arrow-left icon-saida"></i> ${getInfo(saida)}-S</div><div><i class="bi bi-box-arrow-in-right icon-entrada"></i> ${getInfo(entrada)}-E</div>`; } 
        else if (entrada) { dia.classList.add("entrada"); content = `<strong>${d} <i class="bi bi-box-arrow-in-right icon-entrada"></i></strong><div>${getInfo(entrada)}-E</div>`; } 
        else if (saida) { dia.classList.add("saida"); content = `<strong>${d} <i class="bi bi-box-arrow-left icon-saida"></i></strong><div>${getInfo(saida)}-S</div>`; }
        dia.innerHTML = content;
        if (segurancaAtivada) dia.classList.add('seguranca-ativada');
    }

    // --- INÍCIO: MÓDULO DE LIMPEZA ---

    function formatarDataParaID(ano, nomeMes, dia) {
        // Mapeia o nome do mês para o número real do calendário
        const mapeamentoMeses = {
            "Janeiro": 1, "Fevereiro": 2, "Março": 3, "Abril": 4,
            "Maio": 5, "Junho": 6, "Julho": 7, "Agosto": 8,
            "Setembro": 9, "Outubro": 10, "Novembro": 11, "Dezembro": 12
        };
        
        const mesNumero = mapeamentoMeses[nomeMes];
        const mesFormatado = String(mesNumero).padStart(2, '0');
        const diaFormatado = String(dia).padStart(2, '0');
        return `${ano}-${mesFormatado}-${diaFormatado}`;
    }

    // *** INÍCIO: MODIFICAÇÃO (FEATURE 2) - Função 'agendarLimpezaSaida' ***
    function agendarLimpezaSaida(diaDiv) {
        const { unidade, ano, mes, dia } = diaDiv.dataset;
        const dataFormatada = formatarDataParaID(ano, mes, dia);
        const idLimpeza = `${unidade}-${dataFormatada}`;

        if (dadosLimpeza.some(l => l.id === idLimpeza && l.tipo === "Faxina de Saída")) return;

        // Lógica para detectar "edição" (remoção recente + adição)
        let foiEditada = false;
        if (ultimaAcaoLimpeza.acao === 'removida' && ultimaAcaoLimpeza.unidade === unidade) {
            foiEditada = true;
            ultimaAcaoLimpeza = { acao: null, data: null, unidade: null }; // Reseta a flag
        }

        const novaTarefa = {
            id: idLimpeza,
            unidade: unidade,
            data: dataFormatada,
            tipo: "Faxina de Saída",
            status: "Pendente",
            editada: foiEditada // Adiciona a flag transitória
        };
        dadosLimpeza.push(novaTarefa);
        salvarDadosLocalmente(); // Sempre salva após agendar limpeza
    }
    // *** FIM: MODIFICAÇÃO (FEATURE 2) ***

    // *** INÍCIO: MODIFICAÇÃO (FEATURE 2) - Função 'removerLimpezaAgendada' ***
    function removerLimpezaAgendada(diaDiv) {
        const { unidade, ano, mes, dia } = diaDiv.dataset;
        const dataFormatada = formatarDataParaID(ano, mes, dia);
        const idLimpeza = `${unidade}-${dataFormatada}`;

        // Rastreia a remoção para a Feature 2
        const tarefaRemovida = dadosLimpeza.find(l => l.id === idLimpeza && l.tipo === "Faxina de Saída");
        if (tarefaRemovida) {
            ultimaAcaoLimpeza = { acao: 'removida', data: tarefaRemovida.data, unidade: tarefaRemovida.unidade };
        }

        dadosLimpeza = dadosLimpeza.filter(l => !(l.id === idLimpeza && l.tipo === "Faxina de Saída"));
        salvarDadosLocalmente(); // Sempre salva após remover limpeza
    }
    // *** FIM: MODIFICAÇÃO (FEATURE 2) ***

    // *** INÍCIO: MODIFICAÇÃO (FEATURE 1 & 2) - Função 'renderizarControleLimpeza' ***
    function renderizarControleLimpeza() {
        const tabelaBody = document.querySelector("#tabelaLimpeza tbody");
        if (!tabelaBody) return;
        tabelaBody.innerHTML = '';

        // FEATURE 1: Ordena por data (da mais próxima para a mais distante)
        dadosLimpeza.sort((a, b) => new Date(a.data) - new Date(b.data));

        if (dadosLimpeza.length === 0) {
            tabelaBody.innerHTML = '<tr><td colspan="4">Nenhuma tarefa de limpeza agendada.</td></tr>';
            return;
        }

        dadosLimpeza.forEach(tarefa => {
            const tr = document.createElement('tr');
            const statusClass = tarefa.status === 'Pendente' ? 'status-pendente' : 'status-concluida';
            
            // Adiciona classe especial para limpezas editadas
            if (tarefa.editada) {
                tr.classList.add('limpeza-editada');
            }
            
            let statusHTML = `<span class="${statusClass}">${tarefa.status}</span>`;
            if (tarefa.status === 'Pendente') {
                statusHTML = `<button data-id="${tarefa.id}">Marcar Concluída</button>`;
            }

            // FEATURE 2: Adiciona marcação visual para tarefas "editadas"
            const charEditada = tarefa.editada ? '<i class="bi bi-exclamation-triangle-fill icone-editada"></i> ' : '';

            tr.innerHTML = `
                <td>${tarefa.data.split('-').reverse().join('/')}</td>
                <td>${tarefa.unidade}</td>
                <td>${charEditada}${tarefa.tipo}</td>
                <td>${statusHTML}</td>
            `;
            tabelaBody.appendChild(tr);
        });
    }
    // *** FIM: MODIFICAÇÃO (FEATURE 1 & 2) ***

    function handleTabelaLimpezaClick(event) {
        const target = event.target;
        if (target.tagName === 'BUTTON' && target.dataset.id) {
            const tarefaId = target.dataset.id;
            const tarefa = dadosLimpeza.find(l => l.id === tarefaId);
            if (tarefa) {
                tarefa.status = 'Concluída';
                salvarDadosLocalmente();
                renderizarControleLimpeza();
            }
        }
    }
    
    // --- FIM: MÓDULO DE LIMPEZA ---
    
    // --- MÓDULO FINANCEIRO ---
    function salvarDadosFinanceiros() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY_FINANCEIRO, JSON.stringify(dadosFinanceiros));
        } catch (error) { showNotification("Erro ao salvar dados financeiros.", "error"); }
    }

    function encontrarReservasDoCliente(clienteNome) {
        const todasReservas = coletarDadosDeReservas().filter(r => r.entrada === clienteNome || r.saida === clienteNome || r.hospedado === clienteNome);
        const reservasPorUnidade = {};
        todasReservas.forEach(reserva => {
            if (!reservasPorUnidade[reserva.unidade]) reservasPorUnidade[reserva.unidade] = [];
            const getJsMonth = (nomeMes) => ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].indexOf(nomeMes);
            reservasPorUnidade[reserva.unidade].push({ ...reserva, dataObj: new Date(reserva.ano, getJsMonth(reserva.mes), reserva.dia) });
        });
        const blocosDeReserva = [];
        for (const unidade in reservasPorUnidade) {
            const reservasDoCliente = reservasPorUnidade[unidade].sort((a, b) => a.dataObj - b.dataObj);
            if (reservasDoCliente.length === 0) continue;
            let blocoAtual = { inicio: reservasDoCliente[0], fim: reservasDoCliente[0], unidade: unidade, cliente: clienteNome };
            for (let i = 1; i < reservasDoCliente.length; i++) {
                if ((reservasDoCliente[i].dataObj - blocoAtual.fim.dataObj) / (1000 * 3600 * 24) <= 1.5) { // Tolerância para fuso horário
                    blocoAtual.fim = reservasDoCliente[i];
                } else {
                    blocosDeReserva.push(blocoAtual);
                    blocoAtual = { inicio: reservasDoCliente[i], fim: reservasDoCliente[i], unidade: unidade, cliente: clienteNome };
                }
            }
            blocosDeReserva.push(blocoAtual);
        }
        return blocosDeReserva;
    }
    
    function abrirModalFinanceiro(reserva) {
        const formFinanceiro = document.getElementById('formFinanceiro');
        const infoReservaFinanceiro = document.getElementById('infoReservaFinanceiro');
        const reservaIdInput = document.getElementById('reservaIdInput');
        const valorDiariaInput = document.getElementById('valorDiariaInput');
        const valorSinalInput = document.getElementById('valorSinalInput');
        const dataPagSinalInput = document.getElementById('dataPagSinalInput');
        const formaPagSinalInput = document.getElementById('formaPagSinalInput');
        const listaReservasFinanceiro = document.getElementById('listaReservasFinanceiro');
        const modalFinanceiro = document.getElementById('modalFinanceiro');
        
        if (!formFinanceiro) return;
        formFinanceiro.reset();

        const f = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        if(infoReservaFinanceiro) infoReservaFinanceiro.innerHTML = `<strong>Cliente:</strong> ${reserva.cliente}<br><strong>Unidade:</strong> ${reserva.unidade}<br><strong>Período:</strong> ${f(reserva.inicio.dataObj)} a ${f(reserva.fim.dataObj)}`;
        
        const idReservaAtual = `${reserva.unidade}-${reserva.cliente}-${reserva.inicio.dataObj.toISOString().split('T')[0]}`;
        if(reservaIdInput) reservaIdInput.value = idReservaAtual;

        let dadosExistentes = dadosFinanceiros.find(d => d.idReserva && d.idReserva === idReservaAtual);
        if (!dadosExistentes) {
            const dadoOrfaoIndex = dadosFinanceiros.findIndex(d => d.idReserva && d.idReserva.startsWith(`${reserva.unidade}-${reserva.cliente}-`));
            if (dadoOrfaoIndex > -1) {
                if (confirm("Dados financeiros de uma reserva antiga foram encontrados. Deseja movê-los para a reserva atual?")) {
                    dadosFinanceiros[dadoOrfaoIndex].idReserva = idReservaAtual;
                    dadosExistentes = dadosFinanceiros[dadoOrfaoIndex];
                    salvarDadosFinanceiros();
                    showNotification("Dados migrados!", "success");
                }
            }
        }
        if (dadosExistentes) { 
            if(valorDiariaInput) valorDiariaInput.value = dadosExistentes.valorDiaria;
            if(valorSinalInput) valorSinalInput.value = dadosExistentes.valorSinal;
            if(dataPagSinalInput) dataPagSinalInput.value = dadosExistentes.dataPagSinal;
            if(formaPagSinalInput) formaPagSinalInput.value = dadosExistentes.formaPagSinal;
        }
        
        if(listaReservasFinanceiro) listaReservasFinanceiro.style.display = 'none';
        if(infoReservaFinanceiro) infoReservaFinanceiro.style.display = 'block';
        formFinanceiro.style.display = 'block';
        if(modalFinanceiro) modalFinanceiro.style.display = 'flex';
    }

    function handleFormFinanceiroSubmit(event) {
        event.preventDefault();
        const reservaIdInput = document.getElementById('reservaIdInput');
        const valorDiariaInput = document.getElementById('valorDiariaInput');
        const valorSinalInput = document.getElementById('valorSinalInput');
        const dataPagSinalInput = document.getElementById('dataPagSinalInput');
        const formaPagSinalInput = document.getElementById('formaPagSinalInput');
        const modalFinanceiro = document.getElementById('modalFinanceiro');

        if (!reservaIdInput) return;
        const idReserva = reservaIdInput.value;
        const dados = { idReserva, valorDiaria: parseFloat(valorDiariaInput.value) || 0, valorSinal: parseFloat(valorSinalInput.value) || 0, dataPagSinal: dataPagSinalInput.value, formaPagSinal: formaPagSinalInput.value };
        const index = dadosFinanceiros.findIndex(d => d.idReserva === idReserva);
        if (index > -1) { dadosFinanceiros[index] = { ...dadosFinanceiros[index], ...dados }; } 
        else { dadosFinanceiros.push(dados); }
        salvarDadosFinanceiros();
        showNotification("Dados financeiros salvos!", "success");
        if(modalFinanceiro) modalFinanceiro.style.display = 'none';
    }

    // *** INÍCIO: CORREÇÃO DO ERRO (Linha 1409) ***
    function gerarRelatorioFinanceiro() {
        const container = document.getElementById('relatorioFinanceiroConteudo');
        if (!container) return;
        container.innerHTML = '';
        
        // Verifica se há reservas sem dados financeiros
        // Coleta TODAS as reservas do calendário, não apenas dos clientes cadastrados
        const reservasDoCalendario = coletarDadosDeReservas();
        const nomesDeClientes = [...new Set(reservasDoCalendario.flatMap(r => [r.entrada, r.saida, r.hospedado].filter(Boolean)))];
        const todosOsBlocos = nomesDeClientes.flatMap(nome => encontrarReservasDoCliente(nome));
        const reservasSemFinanceiro = todosOsBlocos.filter(bloco => {
            const idReserva = `${bloco.unidade}-${bloco.cliente}-${bloco.inicio.dataObj.toISOString().split('T')[0]}`;
            return !dadosFinanceiros.some(d => d.idReserva === idReserva);
        });
        
        if (reservasSemFinanceiro.length > 0) {
            const avisoHTML = `
                <div style="background-color: #fff3cd; border: 2px solid #ffc107; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                    <h4 style="color: #856404; margin: 0 0 10px 0;">
                        ⚠️ ATENÇÃO: ${reservasSemFinanceiro.length} reserva(s) sem dados financeiros!
                    </h4>
                    <p style="margin: 0; color: #856404;">
                        As seguintes reservas não possuem dados financeiros cadastrados:
                    </p>
                    <ul style="margin: 10px 0 0 20px; color: #856404;">
                        ${reservasSemFinanceiro.slice(0, 5).map(b => {
                            const f = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
                            return `<li><strong>${b.cliente}</strong> - ${b.unidade} (${f(b.inicio.dataObj)} a ${f(b.fim.dataObj)})</li>`;
                        }).join('')}
                        ${reservasSemFinanceiro.length > 5 ? `<li><em>... e mais ${reservasSemFinanceiro.length - 5} reserva(s)</em></li>` : ''}
                    </ul>
                    <p style="margin: 10px 0 0 0; color: #856404; font-weight: bold;">
                        📌 Recomenda-se preencher os dados financeiros de todas as reservas.
                    </p>
                </div>
            `;
            container.innerHTML = avisoHTML;
        }
        
        if (dadosFinanceiros.length === 0) { 
            container.innerHTML += '<p>Nenhum dado financeiro registrado.</p>'; 
            return; 
        }
        const totais = { geral: { valorTotal: 0, sinal: 0, restante: 0 }, unidades: {} };
        unidades.forEach(u => totais.unidades[u] = { valorTotal: 0, sinal: 0, restante: 0 });
        let tableHTML = `<table class="relatorio-financeiro"><thead><tr><th>Cliente</th><th>Unidade</th><th>Período</th><th>Noites</th><th>Vl. Diária</th><th>Vl. Total</th><th>Vl. Sinal</th><th>Restante</th><th>Status Sinal</th></tr></thead><tbody>`;
        // todosOsBlocos já foi definido acima para verificar reservas sem financeiro
        
        dadosFinanceiros.forEach(dado => {
            
            // *** INÍCIO DA CORREÇÃO ***
            // Verifica se 'dado' existe e se 'idReserva' é uma string válida antes de usar 'match'
            if (!dado || typeof dado.idReserva !== 'string') {
                console.warn("Dado financeiro inválido ou sem idReserva:", dado);
                return; // Pula este item do loop para evitar o erro
            }
            // *** FIM DA CORREÇÃO ***

            const match = dado.idReserva.match(/^([^-]+)-(.*?)-(\d{4}-\d{2}-\d{2})$/);
            
            if (!match) {
                 // Se o idReserva existir mas não bater com o formato esperado, loga e continua
                console.warn("Formato de idReserva inesperado:", dado.idReserva);
                return; 
            }

            const [, unidade, cliente, dataInicioISO] = match;
            const bloco = todosOsBlocos.find(b => b.unidade === unidade && b.cliente === cliente && b.inicio.dataObj.toISOString().split('T')[0] === dataInicioISO);
            if (bloco) {
                const noites = Math.ceil(Math.abs(bloco.fim.dataObj - bloco.inicio.dataObj) / (1000 * 3600 * 24));
                const valorTotal = dado.valorDiaria * noites;
                const restante = valorTotal - dado.valorSinal;
                if(totais.unidades[unidade]) {
                    Object.assign(totais.unidades[unidade], { valorTotal: totais.unidades[unidade].valorTotal + valorTotal, sinal: totais.unidades[unidade].sinal + dado.valorSinal, restante: totais.unidades[unidade].restante + restante });
                }
                Object.assign(totais.geral, { valorTotal: totais.geral.valorTotal + valorTotal, sinal: totais.geral.sinal + dado.valorSinal, restante: totais.geral.restante + restante });
                const f = (dt) => `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
                const statusSinal = dado.dataPagSinal ? `Pago em ${dado.dataPagSinal.split('-').reverse().join('/')} (${dado.formaPagSinal})` : 'Pendente';
                tableHTML += `<tr><td>${cliente}</td><td>${unidade}</td><td>${f(bloco.inicio.dataObj)} a ${f(bloco.fim.dataObj)}</td><td>${noites}</td><td>R$ ${dado.valorDiaria.toFixed(2)}</td><td>R$ ${valorTotal.toFixed(2)}</td><td>R$ ${dado.valorSinal.toFixed(2)}</td><td>R$ ${restante.toFixed(2)}</td><td>${statusSinal}</td></tr>`;
            } else {
                if (totais.unidades[unidade]) totais.unidades[unidade].sinal += dado.valorSinal;
                totais.geral.sinal += dado.valorSinal;
                tableHTML += `<tr style="background-color: #ffe0e0;"><td>${cliente}</td><td>${unidade}</td><td colspan="2"><strong style="color: red;">Reserva não encontrada!</strong></td><td>R$ ${dado.valorDiaria.toFixed(2)}</td><td>N/A</td><td>R$ ${dado.valorSinal.toFixed(2)}</td><td>N/A</td><td>${dado.dataPagSinal ? `Pago em ${dado.dataPagSinal.split('-').reverse().join('/')} (${dado.formaPagSinal})` : 'Pendente'}</td></tr>`;
            }
        });
        tableHTML += `</tbody><tfoot>`;
        for(const unidade of unidades) {
            if(totais.unidades[unidade] && (totais.unidades[unidade].valorTotal > 0 || totais.unidades[unidade].sinal > 0)){
                tableHTML += `<tr><td colspan="5"><strong>Total ${unidade}</strong></td><td><strong>R$ ${totais.unidades[unidade].valorTotal.toFixed(2)}</strong></td><td><strong>R$ ${totais.unidades[unidade].sinal.toFixed(2)}</strong></td><td><strong>R$ ${totais.unidades[unidade].restante.toFixed(2)}</strong></td><td></td></tr>`;
            }
        }
        tableHTML += `<tr style="background-color: #e0e0e0;"><td colspan="5"><strong>TOTAL GERAL</strong></td><td><strong>R$ ${totais.geral.valorTotal.toFixed(2)}</strong></td><td><strong>R$ ${totais.geral.sinal.toFixed(2)}</strong></td><td><strong>R$ ${totais.geral.restante.toFixed(2)}</strong></td><td></td></tr>`;
        container.innerHTML = tableHTML + `</tfoot></table>`;
    }
    // *** FIM: CORREÇÃO DO ERRO ***
    
    function gerarRelatorioDetalhado() {
        const relatorioConteudoTexto = document.getElementById('relatorioConteudoTexto');
        if (!relatorioConteudoTexto) return;
        relatorioConteudoTexto.innerHTML = '';
        const blocosDeReserva = [...new Set(clientes.map(c => c.nome))].flatMap(nome => encontrarReservasDoCliente(nome));
        if (blocosDeReserva.length === 0) { relatorioConteudoTexto.innerHTML = '<p>Nenhuma reserva registrada.</p>'; return; }
        const diasTotais = meses.reduce((total, mes) => total + mes.dias, 0);
        const ocupacao = analisarOcupacaoDosDias();
        const htmlResumoGeral = document.createElement('div');
        htmlResumoGeral.innerHTML = `<h3>Resumo de Ocupação Geral</h3>`;
        for (const unidade of unidades) {
            const diasOcupados = ocupacao[unidade] ? Object.keys(ocupacao[unidade]).length : 0;
            const porcentagemOcupacao = diasTotais > 0 ? (diasOcupados / diasTotais * 100).toFixed(2) : 0;
            htmlResumoGeral.innerHTML += `<p><strong>Unidade: ${unidade}</strong> | Ocupados: ${diasOcupados} | Livres: ${diasTotais - diasOcupados} | Taxa: ${porcentagemOcupacao}%</p>`;
        }
        relatorioConteudoTexto.appendChild(htmlResumoGeral);
        relatorioConteudoTexto.innerHTML += '<hr>';
        const relatoriosPorUnidade = {};
        blocosDeReserva.forEach(bloco => {
            if(!relatoriosPorUnidade[bloco.unidade]) relatoriosPorUnidade[bloco.unidade] = [];
            relatoriosPorUnidade[bloco.unidade].push(bloco);
        });
        for (const unidade of unidades) {
            if (relatoriosPorUnidade[unidade] && relatoriosPorUnidade[unidade].length > 0) {
                const htmlUnidade = document.createElement('div');
                htmlUnidade.innerHTML = `<h4>Reservas da Unidade ${unidade}</h4>`;
                const ul = document.createElement('ul');
                relatoriosPorUnidade[unidade].forEach(bloco => {
                    const noites = Math.ceil(Math.abs(bloco.fim.dataObj - bloco.inicio.dataObj) / (1000 * 3600 * 24));
                    const f = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                    const clienteInfo = clientes.find(c => c.nome === bloco.cliente);
                    const texto = `${bloco.cliente} (Whats: ${clienteInfo ? (clienteInfo.whats || 'N/A') : 'N/A'}): Entra (${f(bloco.inicio.dataObj)}) - Sai (${f(bloco.fim.dataObj)}) = ${noites} noites`;
                    const li = document.createElement('li');
                    li.textContent = texto;
                    ul.appendChild(li);
                });
                htmlUnidade.appendChild(ul);
                relatorioConteudoTexto.appendChild(htmlUnidade);
            }
        }
    }

    function analisarOcupacaoDosDias() {
        const ocupacao = {};
        unidades.forEach(u => ocupacao[u] = {});
        document.querySelectorAll('.dia').forEach(dia => {
            const { entrada, saida, hospedado, unidade, mes, ano, dia: diaNum } = dia.dataset;
            if (entrada || saida || hospedado) {
                const chaveData = `${ano}-${mes}-${diaNum}`;
                ocupacao[unidade][chaveData] = { entrada: !!entrada, saida: !!saida, hospedado: !!hospedado };
            }
        });
        return ocupacao;
    }

    function gerarRelatorioVisual() {
        const relatorioConteudoVisual = document.getElementById('relatorioConteudoVisual');
        if (!relatorioConteudoVisual) return;
        relatorioConteudoVisual.innerHTML = ''; 
        const ocupacao = analisarOcupacaoDosDias();
        const diasDaSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
        
        unidades.forEach(unidade => { 
            const containerUnidade = document.createElement('div');
            containerUnidade.classList.add('unidade-relatorio'); 
            containerUnidade.innerHTML = `<h4>Unidade: ${unidade}</h4>`;
            
            meses.forEach(mesInfo => { 
                const containerMes = document.createElement('div');
                containerMes.classList.add('mes-relatorio'); 
                containerMes.innerHTML = `<h5>${mesInfo.nome} ${mesInfo.ano}</h5>`;
                
                const gridDias = document.createElement('div');
                gridDias.classList.add('dias-relatorio');
                
                diasDaSemana.forEach(dia => { 
                    const headerDia = document.createElement('div');
                    headerDia.classList.add('dia-relatorio', 'header');
                    headerDia.textContent = dia;
                    gridDias.appendChild(headerDia);
                });
                
                const getJsMonth = (nomeMes) => ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].indexOf(nomeMes);
                const primeiroDia = new Date(mesInfo.ano, getJsMonth(mesInfo.nome), 1).getDay();
                
                for (let i = 0; i < primeiroDia; i++) { 
                    gridDias.appendChild(document.createElement('div')); 
                }

                for (let i = 1; i <= mesInfo.dias; i++) {
                    const diaDiv = document.createElement('div');
                    diaDiv.classList.add('dia-relatorio');
                    diaDiv.textContent = i;
                    
                    const chaveData = `${mesInfo.ano}-${mesInfo.nome}-${i}`;
                    const diaOcupacao = ocupacao[unidade] ? ocupacao[unidade][chaveData] : null;

                    if (diaOcupacao) {
                        if (diaOcupacao.entrada && diaOcupacao.saida) diaDiv.classList.add('troca');
                        else if (diaOcupacao.hospedado || diaOcupacao.entrada) diaDiv.classList.add('noite-ocupada');
                        else if (diaOcupacao.saida) diaDiv.classList.add('checkout-apenas');
                    }
                    gridDias.appendChild(diaDiv);
                }

                containerMes.appendChild(gridDias);
                containerUnidade.appendChild(containerMes);
            });
            relatorioConteudoVisual.appendChild(containerUnidade); 
        });
    }
    
    // LÓGICA DE INTERAÇÃO COM O CALENDÁRIO
    function registrarReserva(dia) {
        if (!clienteSelecionado) return showNotification("Selecione um cliente para fazer uma reserva.", "error");
        const cliente = clientes.find(c => c.nome === clienteSelecionado);
        if (!cliente) return;
        let { entrada, saida, hospedado } = dia.dataset;

        const eraSaida = saida === cliente.nome;

        if (saida === cliente.nome && entrada && entrada !== cliente.nome) { dia.dataset.saida = ""; } 
        else if (entrada === cliente.nome && saida && saida !== cliente.nome) { dia.dataset.entrada = ""; } 
        else if (hospedado && hospedado !== cliente.nome) { return showNotification("Este dia já está ocupado por outro cliente.", "error"); } 
        else if (entrada === cliente.nome && saida === cliente.nome) { dia.dataset.entrada = ""; dia.dataset.saida = ""; dia.dataset.hospedado = ""; } 
        else if (entrada === cliente.nome && !saida) { dia.dataset.hospedado = cliente.nome; dia.dataset.entrada = ""; dia.dataset.saida = ""; } 
        else if (hospedado === cliente.nome) { 
            dia.dataset.saida = cliente.nome; 
            dia.dataset.entrada = ""; 
            dia.dataset.hospedado = ""; 
            agendarLimpezaSaida(dia);
        } 
        else if (saida === cliente.nome && !entrada) { dia.dataset.entrada = ""; dia.dataset.saida = ""; dia.dataset.hospedado = ""; } 
        else if (!entrada && !saida && !hospedado) { dia.dataset.entrada = cliente.nome; } 
        else if (entrada && entrada !== cliente.nome && !saida) { dia.dataset.saida = cliente.nome; } 
        else if (saida && saida !== cliente.nome && !entrada) { dia.dataset.entrada = cliente.nome; } 
        else if (entrada && entrada !== cliente.nome && saida && saida !== cliente.nome) { return showNotification("Este dia já está ocupado por outros clientes.", "error"); }

        const virouOutraCoisa = dia.dataset.saida !== cliente.nome;
        if (eraSaida && virouOutraCoisa) {
            removerLimpezaAgendada(dia);
        }

        atualizarVisual(dia);
        salvarDadosLocalmente(); // Sempre salva após editar reserva
    }

    function limparDia(dia) {
        dia.dataset.entrada = "";
        dia.dataset.saida = "";
        dia.dataset.hospedado = "";
        atualizarVisual(dia);
        salvarDadosLocalmente(); // Sempre salva após limpar dia
    }
    
    function gerenciarTooltip(event) {
        const diaDiv = event.target.closest('.dia');
        const tooltip = document.getElementById('tooltip');
        if (!tooltip || !diaDiv) { hideTooltip(); return; }
        const { entrada, saida, hospedado } = diaDiv.dataset;
        const clientesDoDia = [...new Set([entrada, saida, hospedado].filter(Boolean))];
        if (clientesDoDia.length === 0) { hideTooltip(); return; }
        let tooltipContent = '';
        clientesDoDia.forEach(nomeCliente => {
            const clienteInfo = clientes.find(c => c.nome === nomeCliente);
            if (clienteInfo) {
                tooltipContent += `<div style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 5px;">
                        <strong>${clienteInfo.nome}</strong><br>
                        <strong>WhatsApp:</strong> ${clienteInfo.whats || 'N/A'}<br>
                        <strong>País:</strong> ${clienteInfo.pais || 'N/A'}<br>
                        <strong>Temporada:</strong> ${clienteInfo.tempo || 'N/A'}<br>
                        <strong>Unidade Pref.:</strong> ${clienteInfo.unidade || 'N/A'}<br>
                        <strong>Status:</strong> ${clienteInfo.status || 'N/A'}
                    </div>`;
            }
        });
        if (tooltipContent) {
            tooltip.innerHTML = tooltipContent;
            tooltip.style.left = (event.pageX + 15) + 'px';
            tooltip.style.top = (event.pageY + 15) + 'px';
            tooltip.style.display = 'block';
        } else {
            hideTooltip();
        }
    }

    function hideTooltip() {
         const tooltip = document.getElementById('tooltip');
         if(tooltip) tooltip.style.display = 'none';
    }

    function handleCalendarClick(event) {
        const diaDiv = event.target.closest('.dia');
        if (!diaDiv) return;
        if (segurancaAtivada) { showNotification("Modo de segurança ativado.", "info"); return; }
        
        if (event.type === 'click') {
            if (clienteSelecionado) {
                registrarReserva(diaDiv);
            }
        }
        // --- CORREÇÃO AQUI ---
        // Adicionada a verificação "&& clienteSelecionado"
        else if ( (event.type === 'dblclick' || (event.type === 'contextmenu' && event.button === 2)) && clienteSelecionado ) {
            event.preventDefault();
            limparDia(diaDiv); 
        } 
        // Adicionado "else" para capturar cliques com botão direito sem cliente
        else if (event.type === 'contextmenu' && !clienteSelecionado) {
            event.preventDefault(); // Apenas impede o menu de contexto de abrir
        }
    }
    
    // INICIALIZAÇÃO E LISTENERS (Movidos para dentro do DOMContentLoaded)
    document.addEventListener('DOMContentLoaded', () => { 
        
        // --- Referências DOM
        const clienteSelect = document.getElementById("clienteSelect");
        const container = document.getElementById("calendario-container");
        const mesAtualDisplay = document.getElementById('mesAtualDisplay');
        const mesAnteriorBtn = document.getElementById('mesAnteriorBtn');
        const mesProximoBtn = document.getElementById('mesProximoBtn');
        const filtroResvCheckbox = document.getElementById("filtroResvCheckbox");
        const adicionarClienteBtn = document.getElementById('adicionarClienteBtn');
        const editarClienteBtn = document.getElementById('editarClienteBtn');
        const removerClienteBtn = document.getElementById('removerClienteBtn');
        const segurancaBtn = document.getElementById('segurancaBtn');
        const ajudaBtn = document.getElementById("ajudaBtn");
        const modalAjuda = document.getElementById("modalAjuda");
        const gerarRelatorioBtn = document.getElementById('gerarRelatorioBtn');
        const modalRelatorio = document.getElementById('modalRelatorio');
        const modalCliente = document.getElementById('modalCliente');
        const formCliente = document.getElementById('formCliente');
        const importarClientesBtn = document.getElementById("importarClientesBtn");
        const importarClientesInput = document.getElementById("importarClientesInput");
        const importarBackupCompletoBtn = document.getElementById("importarBackupCompletoBtn");
        const importarBackupCompletoInput = document.getElementById("importarBackupCompletoInput");
        const exportarClientesBtn = document.getElementById('exportarClientesBtn');
        const exportarReservasTXTBtn = document.getElementById('exportarReservasTXTBtn');
        const exportarBackupCompletoBtn = document.getElementById("exportarBackupCompletoBtn");
        const exportarFinanceiroJSONBtn = document.getElementById("exportarFinanceiroJSONBtn");
        const salvarLocalmenteBtn = document.getElementById('salvarLocalmenteBtn');
        const limparDadosLocaisBtn = document.getElementById('limparDadosLocaisBtn');
        const autoBackupToggle = document.getElementById('autoBackupToggle');
        const tooltip = document.getElementById('tooltip');
        const gerenciarFinanceiroBtn = document.getElementById('gerenciarFinanceiroBtn');
        const gerarRelatorioFinanceiroBtn = document.getElementById('gerarRelatorioFinanceiroBtn');
        const modalFinanceiro = document.getElementById('modalFinanceiro');
        const modalRelatorioFinanceiro = document.getElementById('modalRelatorioFinanceiro');
        const formFinanceiro = document.getElementById('formFinanceiro');
        const menuToggleBtn = document.getElementById('menu-toggle-btn');
        const overlay = document.getElementById('overlay');
        const verControleLimpezaBtn = document.getElementById('verControleLimpezaBtn');
        const agendarLimpezaExtraBtn = document.getElementById('agendarLimpezaExtraBtn');
        const modalControleLimpeza = document.getElementById('modalControleLimpeza');
        const modalAgendarLimpeza = document.getElementById('modalAgendarLimpeza');
        const formLimpezaExtra = document.getElementById('formLimpezaExtra');
        const tabelaLimpeza = document.getElementById('tabelaLimpeza');
        const enviarLimpezaWhatsAppBtn = document.getElementById('enviarLimpezaWhatsAppBtn'); // *** ADICIONADO (FEATURE 3) ***
        
        // --- Inicialização ---
        criarCalendario(); 
        carregarDadosLocais();
        sincronizarLimpezasComSaidas(); // Sincroniza limpezas com saídas existentes
        // Event listener para botão de impressão
        const printBtn = document.querySelector('.print-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => window.print());
        }
 
        aplicarFiltros(); 

        // --- Adição dos Listeners ---
        window.addEventListener('beforeunload', (e) => { e.preventDefault(); e.returnValue = 'Tem certeza que deseja sair? As alterações não salvas podem ser perdidas.'; });
        
        if (menuToggleBtn) menuToggleBtn.addEventListener('click', toggleMenu);
        if (overlay) overlay.addEventListener('click', toggleMenu);

        if (mesAnteriorBtn) mesAnteriorBtn.addEventListener('click', () => { if (mesAtualIndex > 0) { mesAtualIndex--; atualizarVisualizacaoMes(); } });
        if (mesProximoBtn) mesProximoBtn.addEventListener('click', () => { if (mesAtualIndex < meses.length - 1) { mesAtualIndex++; atualizarVisualizacaoMes(); } });
        
        if (clienteSelect) {
            clienteSelect.addEventListener('change', () => {
                clienteSelecionado = clienteSelect.value;
                const desabilitar = !clienteSelecionado;
                if(editarClienteBtn) editarClienteBtn.disabled = desabilitar;
                if(removerClienteBtn) removerClienteBtn.disabled = desabilitar;
                if(gerenciarFinanceiroBtn) gerenciarFinanceiroBtn.disabled = desabilitar;
                aplicarFiltros();
            });
        }
        
        if (filtroResvCheckbox) filtroResvCheckbox.addEventListener('change', () => { preencherListaClientes(clientes); aplicarFiltros(); });
        
        // Botão "Limpar Filtros" removido - funcionalidade obsoleta
        
        if (adicionarClienteBtn) adicionarClienteBtn.addEventListener('click', () => abrirModalCliente('adicionar'));
        if (editarClienteBtn) editarClienteBtn.addEventListener('click', () => { const cliente = clientes.find(c => c.nome === clienteSelect.value); if(cliente) abrirModalCliente('editar', cliente); });
        if (removerClienteBtn) {
            removerClienteBtn.addEventListener('click', () => {
                const nome = clienteSelect.value;
                if (!nome || !confirm(`Tem certeza que deseja remover o cliente "${nome}"?`)) return;
                clientes = clientes.filter(c => c.nome !== nome);
                dadosFinanceiros = dadosFinanceiros.filter(df => !df.idReserva.includes(`-${nome}-`)); 
                salvarDadosFinanceiros(); 
                preencherListaClientes(clientes);
                salvarDadosLocalmente();
                // Limpa seleção após remover cliente
                if(clienteSelect) clienteSelect.value = "";
                clienteSelecionado = null;
                [editarClienteBtn, removerClienteBtn, gerenciarFinanceiroBtn].forEach(btn => { if(btn) btn.disabled = true; });
                aplicarFiltros();
            });
        }
        
        if (formCliente) formCliente.addEventListener('submit', handleFormClienteSubmit);
        if (modalCliente) modalCliente.querySelector('.modal-close-btn').addEventListener('click', () => modalCliente.style.display = 'none');
        
        if (ajudaBtn) ajudaBtn.addEventListener('click', () => { if(modalAjuda) modalAjuda.style.display = 'flex'; });
        if (modalAjuda) modalAjuda.querySelector('.modal-close-btn').addEventListener('click', () => modalAjuda.style.display = 'none');
        
        if (segurancaBtn) {
            segurancaBtn.addEventListener('click', () => {
              segurancaAtivada = !segurancaAtivada;
              segurancaBtn.innerHTML = segurancaAtivada ? `<i class="bi bi-lock-fill"></i> Segurança Ativada` : `<i class="bi bi-unlock-fill"></i> Segurança Desativada`;
              segurancaBtn.classList.toggle('seguranca-ativada', segurancaAtivada);
              document.querySelectorAll('.dia').forEach(dia => dia.classList.toggle('seguranca-ativada', segurancaAtivada));
              showNotification(segurancaAtivada ? "Modo de segurança ativado." : "Modo de segurança desativado.", "info");
            });
        }

        if (salvarLocalmenteBtn) salvarLocalmenteBtn.addEventListener('click', salvarDadosLocalmente);
        if (limparDadosLocaisBtn) limparDadosLocaisBtn.addEventListener('click', limparDadosLocais);
        
        // Listeners de Import/Export
        if (importarBackupCompletoBtn) importarBackupCompletoBtn.addEventListener('click', () => { if (importarBackupCompletoInput) importarBackupCompletoInput.click(); });
        if (importarClientesBtn) importarClientesBtn.addEventListener('click', () => { if(importarClientesInput) importarClientesInput.click(); });
        
        if (importarBackupCompletoInput) importarBackupCompletoInput.addEventListener('change', e => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onload = ev => importarBackupCompleto(ev.target.result); r.readAsText(f); } e.target.value = null; });
        if (importarClientesInput) importarClientesInput.addEventListener('change', e => { const f = e.target.files[0]; if(f) { const r = new FileReader(); r.onload = ev => importarListaClientes(ev.target.result); r.readAsText(f); } e.target.value = null; });

        if (exportarBackupCompletoBtn) exportarBackupCompletoBtn.addEventListener('click', exportarBackupCompleto);
        if (exportarClientesBtn) exportarClientesBtn.addEventListener('click', exportarListaClientes);
        if (exportarReservasTXTBtn) exportarReservasTXTBtn.addEventListener('click', exportarReservasTXT);
        if (exportarFinanceiroJSONBtn) exportarFinanceiroJSONBtn.addEventListener('click', exportarFinanceiroJSON);


        // Listeners dos Modais de Relatório
        if (gerarRelatorioBtn) {
            gerarRelatorioBtn.addEventListener('click', () => { 
                gerarRelatorioDetalhado(); 
                gerarRelatorioVisual(); 
                if(modalRelatorio) {
                    modalRelatorio.style.display = 'flex'; 
                    modalRelatorio.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    modalRelatorio.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
                    const tabTexto = modalRelatorio.querySelector('.tab-btn[data-target="relatorioConteudoTexto"]');
                    const contentTexto = document.getElementById('relatorioConteudoTexto');
                    if (tabTexto) tabTexto.classList.add('active');
                    if (contentTexto) contentTexto.classList.add('active');
                }
            });
        }
        if (modalRelatorio) {
            modalRelatorio.querySelector('.modal-close-btn').addEventListener('click', () => modalRelatorio.style.display = 'none');
            modalRelatorio.querySelectorAll('.tab-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    modalRelatorio.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    modalRelatorio.querySelectorAll('.report-content').forEach(c => c.classList.remove('active'));
                    btn.classList.add('active');
                    const targetContent = document.getElementById(btn.dataset.target);
                    if (targetContent) targetContent.classList.add('active');
                });
            });
        }

        // Listeners do Módulo Financeiro
        if (formFinanceiro) formFinanceiro.addEventListener('submit', handleFormFinanceiroSubmit);
        if (modalFinanceiro) modalFinanceiro.querySelector('.modal-close-btn').addEventListener('click', () => modalFinanceiro.style.display = 'none');
        if (gerarRelatorioFinanceiroBtn) gerarRelatorioFinanceiroBtn.addEventListener('click', () => { gerarRelatorioFinanceiro(); if(modalRelatorioFinanceiro) modalRelatorioFinanceiro.style.display = 'flex'; });
        if (modalRelatorioFinanceiro) modalRelatorioFinanceiro.querySelector('.modal-close-btn').addEventListener('click', () => modalRelatorioFinanceiro.style.display = 'none');
        
        if (gerenciarFinanceiroBtn) {
            gerenciarFinanceiroBtn.addEventListener('click', () => {
                const clienteSelect = document.getElementById("clienteSelect");
                if (!clienteSelect) return;
                const clienteNome = clienteSelect.value;
                if (!clienteNome) return;
                const blocosDeReserva = encontrarReservasDoCliente(clienteNome);
                if (blocosDeReserva.length === 0) { showNotification("Nenhuma reserva encontrada para este cliente.", "info"); return; }
                if (blocosDeReserva.length === 1) {
                    abrirModalFinanceiro(blocosDeReserva[0]);
                } else {
                    const listaReservasFinanceiro = document.getElementById('listaReservasFinanceiro');
                    if (!listaReservasFinanceiro) return;
                    listaReservasFinanceiro.innerHTML = '<h4>Selecione uma reserva para editar:</h4>';
                    const f = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                    blocosDeReserva.forEach(bloco => {
                        const btn = document.createElement('button');
                        btn.textContent = `Unidade ${bloco.unidade}: de ${f(bloco.inicio.dataObj)} a ${f(bloco.fim.dataObj)}`;
                        btn.onclick = () => abrirModalFinanceiro(bloco);
                        listaReservasFinanceiro.appendChild(btn);
                    });
                    const infoReservaFinanceiro = document.getElementById('infoReservaFinanceiro');
                    const formFinanceiro = document.getElementById('formFinanceiro');
                    const modalFinanceiro = document.getElementById('modalFinanceiro');
                    if(infoReservaFinanceiro) infoReservaFinanceiro.style.display = 'none';
                    if(formFinanceiro) formFinanceiro.style.display = 'none';
                    listaReservasFinanceiro.style.display = 'block';
                    if(modalFinanceiro) modalFinanceiro.style.display = 'flex';
                }
            });
        }

        // Listeners do Módulo de Limpeza
        if (verControleLimpezaBtn) {
            verControleLimpezaBtn.addEventListener('click', () => {
                renderizarControleLimpeza();
                if (modalControleLimpeza) modalControleLimpeza.style.display = 'flex';
            });
        }
        if (agendarLimpezaExtraBtn) {
            agendarLimpezaExtraBtn.addEventListener('click', () => {
                if (formLimpezaExtra) formLimpezaExtra.reset();
                if (modalAgendarLimpeza) modalAgendarLimpeza.style.display = 'flex';
            });
        }
        
        // *** INÍCIO: MODIFICAÇÃO (FEATURE 2) - Limpa flags ao fechar modal ***
        if (modalControleLimpeza) {
            modalControleLimpeza.querySelector('.modal-close-btn').addEventListener('click', () => {
                // Verifica se há limpezas editadas antes de fechar
                const totalEditadas = dadosLimpeza.filter(l => l.editada).length;
                if (totalEditadas > 0) {
                    const confirmar = confirm(
                        `⚠️ ATENÇÃO: Existem ${totalEditadas} limpeza(s) ALTERADA(S) que ainda não foram enviadas!\n\n` +
                        `Recomenda-se enviar a lista atualizada para o WhatsApp antes de fechar.\n\n` +
                        `Deseja fechar mesmo assim?`
                    );
                    if (!confirmar) return; // Não fecha se o usuário cancelar
                }
                
                modalControleLimpeza.style.display = 'none';
                // Limpa as flags de edição
                dadosLimpeza.forEach(l => l.editada = false);
                ultimaAcaoLimpeza = { acao: null, data: null, unidade: null };
            });
        }
        // *** FIM: MODIFICAÇÃO (FEATURE 2) ***
        
        if (tabelaLimpeza) {
            tabelaLimpeza.addEventListener('click', handleTabelaLimpezaClick);
        }
        if (modalAgendarLimpeza) {
            modalAgendarLimpeza.querySelector('.modal-close-btn').addEventListener('click', () => modalAgendarLimpeza.style.display = 'none');
        }
        if (formLimpezaExtra) {
            formLimpezaExtra.addEventListener('submit', (e) => {
                e.preventDefault();
                const unidade = document.getElementById('limpezaUnidadeSelect').value;
                const data = document.getElementById('limpezaDataInput').value;
                const tipo = document.getElementById('limpezaTipoSelect').value;
                const idLimpeza = `${unidade}-${data}-${tipo.replace(' ', '')}-${Date.now()}`; // ID único para extras
                
                const novaTarefa = { id: idLimpeza, unidade, data, tipo, status: 'Pendente' };
                dadosLimpeza.push(novaTarefa);
                salvarDadosLocalmente();
                showNotification('Limpeza manual agendada!', 'success');
                if (modalAgendarLimpeza) modalAgendarLimpeza.style.display = 'none';
            });
        }
        
        // Listener do Botão Limpar Marcações
        const limparMarcacoesBtn = document.getElementById('limparMarcacoesBtn');
        if (limparMarcacoesBtn) {
            limparMarcacoesBtn.addEventListener('click', () => {
                const totalEditadas = dadosLimpeza.filter(t => t.editada).length;
                if (totalEditadas === 0) {
                    showNotification("Não há marcações de edição para limpar.", "info");
                    return;
                }
                
                if (confirm(`Deseja remover a marcação de "ALTERADA" de ${totalEditadas} limpeza(s)?\n\nIsso não apagará as limpezas, apenas removerá o destaque visual.`)) {
                    dadosLimpeza.forEach(tarefa => {
                        tarefa.editada = false;
                    });
                    salvarDadosLocalmente();
                    renderizarControleLimpeza();
                    showNotification(`${totalEditadas} marcação(ões) removida(s) com sucesso!`, "success");
                }
            });
        }
        
        // *** INÍCIO: MODIFICAÇÃO (FEATURE 3) - Listener do Botão WhatsApp ***
        if (enviarLimpezaWhatsAppBtn) {
            enviarLimpezaWhatsAppBtn.addEventListener('click', () => {
                if (dadosLimpeza.length === 0) {
                    showNotification("Nenhuma tarefa de limpeza para enviar.", "info");
                    return;
                }
                
                // Ordena os dados por data
                const dadosOrdenados = [...dadosLimpeza].sort((a, b) => new Date(a.data) - new Date(b.data));
                
                // Agrupa por data
                const agrupadoPorData = {};
                dadosOrdenados.forEach(tarefa => {
                    if (!agrupadoPorData[tarefa.data]) {
                        agrupadoPorData[tarefa.data] = [];
                    }
                    agrupadoPorData[tarefa.data].push(tarefa);
                });
                
                // Conta pendentes, concluídas e editadas
                const totalPendentes = dadosOrdenados.filter(t => t.status === 'Pendente').length;
                const totalConcluidas = dadosOrdenados.filter(t => t.status === 'Concluída').length;
                const totalEditadas = dadosOrdenados.filter(t => t.editada).length;
                
                // Monta a mensagem
                let mensagem = `🧹 *CONTROLE DE LIMPEZA* 🧹\n`;
                mensagem += `📅 ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
                
                // Alerta se houver limpezas editadas
                if (totalEditadas > 0) {
                    mensagem += `🚨 *ATENÇÃO: ${totalEditadas} LIMPEZA(S) ALTERADA(S)!* 🚨\n`;
                    mensagem += `🔄 Houve mudanças desde a última lista enviada!\n\n`;
                }
                
                mensagem += `📊 *RESUMO:*\n`;
                mensagem += `• Total: ${dadosOrdenados.length} tarefa(s)\n`;
                mensagem += `• 🔴 Pendentes: ${totalPendentes}\n`;
                mensagem += `• ✅ Concluídas: ${totalConcluidas}\n`;
                if (totalEditadas > 0) {
                    mensagem += `• 🔄 Alteradas: ${totalEditadas}\n`;
                }
                mensagem += `${'='.repeat(35)}\n\n`;
                
                // Adiciona tarefas agrupadas por data
                Object.keys(agrupadoPorData).forEach(data => {
                    const tarefasDoDia = agrupadoPorData[data];
                    const dataF = data.split('-').reverse().join('/');
                    const diaSemana = new Date(data).toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
                    
                    mensagem += `📆 *${diaSemana} - ${dataF}*\n`;
                    
                    tarefasDoDia.forEach(tarefa => {
                        const isPendente = tarefa.status === 'Pendente';
                        const statusEmoji = isPendente ? '🔴' : '✅';
                        const destaque = isPendente ? '⚠️ *URGENTE*' : '';
                        const editadaMarca = tarefa.editada ? '🔄 *[ALTERADA]* ' : '';
                        
                        mensagem += `  ${statusEmoji} *${tarefa.unidade}* - ${tarefa.tipo}`;
                        if (editadaMarca) mensagem += ` ${editadaMarca}`;
                        if (destaque) mensagem += ` ${destaque}`;
                        mensagem += `\n`;
                    });
                    
                    mensagem += `\n`;
                });
                
                mensagem += `${'='.repeat(35)}\n`;
                mensagem += `📌 *Legenda:*\n`;
                mensagem += `🔴 = Pendente (ATENÇÃO!)\n`;
                mensagem += `✅ = Concluída\n`;
                mensagem += `🔄 = Alterada (houve mudança!)\n`;

                const telefone = '5548988252649';
                const textoCodificado = encodeURIComponent(mensagem);
                const urlWhatsApp = `https://wa.me/${telefone}?text=${textoCodificado}`;
                
                window.open(urlWhatsApp, '_blank');
            });
        }
        // *** FIM: MODIFICAÇÃO (FEATURE 3) ***

        // Listeners do Calendário
        if (container) {
            container.addEventListener('mouseover', gerenciarTooltip);
            container.addEventListener('mouseout', hideTooltip);
            container.addEventListener('click', handleCalendarClick);
            container.addEventListener('dblclick', handleCalendarClick);
            container.addEventListener('contextmenu', handleCalendarClick);
        }

        // *** AVISO AO SAIR DA PÁGINA SEM BACKUP ***
        let backupRealizadoNaSessao = false;
        
        // Marca que backup foi realizado quando usuário exporta backup completo
        // (usa a variável já declarada no início do DOMContentLoaded)
        if (exportarBackupCompletoBtn) {
            exportarBackupCompletoBtn.addEventListener('click', () => {
                backupRealizadoNaSessao = true;
            });
        }
        
        // Aviso ao tentar sair da página
        window.addEventListener('beforeunload', (e) => {
            // Verifica se há dados e se backup não foi realizado
            const temReservasNoCalendario = document.querySelectorAll('.dia[data-entrada], .dia[data-saida], .dia[data-hospedado]').length > 0;
            const temDados = clientes.length > 0 || dadosFinanceiros.length > 0 || dadosLimpeza.length > 0 || temReservasNoCalendario;
            
            if (temDados && !backupRealizadoNaSessao) {
                const mensagem = '⚠️ ATENÇÃO: Você não exportou o backup completo nesta sessão!\n\nRecomenda-se SEMPRE exportar o backup antes de sair para evitar perda de dados.\n\nDeseja realmente sair?';
                e.preventDefault();
                e.returnValue = mensagem; // Para navegadores antigos
                return mensagem;
            }
        });

    }); // Fim do DOMContentLoaded

})();