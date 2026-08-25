// Prompt templates: save/edit/delete, plus the "apply" flow that collects
// (変数) values in a modal and hands the substituted result to a caller-supplied
// callback. openTemplateApplyModal is also used by characters.js and the
// template chip's own "適用" button.
async function renderTemplates() {
  const templates = await window.api.loadTemplates();
  loadedTemplates = templates;
  templateListEl.innerHTML = '';
  templates.forEach((template) => {
    const chip = document.createElement('div');
    chip.className = 'template-chip';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'template-name';
    nameSpan.textContent = template.name;
    nameSpan.title = template.text;

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'template-apply';
    applyBtn.textContent = '適用';
    applyBtn.addEventListener('click', () => {
      const target = lastFocusedTextarea || promptEl;
      openTemplateApplyModal(template, (result) => {
        target.value = result;
        target.dispatchEvent(new Event('change'));
      });
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'template-edit';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => openTemplateEditModal(template));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'template-delete';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      await window.api.deleteTemplate(template.id);
      renderTemplates();
    });

    chip.appendChild(nameSpan);
    chip.appendChild(applyBtn);
    chip.appendChild(editBtn);
    chip.appendChild(deleteBtn);
    templateListEl.appendChild(chip);
  });
  renderCharNameSourceOptions();
}

function openTemplateEditModal(template) {
  editingTemplateId = template.id;
  templateEditNameEl.value = template.name;
  templateEditTextEl.value = template.text;
  templateEditOverlayEl.classList.add('open');
}

function closeTemplateEditModal() {
  editingTemplateId = null;
  templateEditOverlayEl.classList.remove('open');
}

templateEditCancelBtn.addEventListener('click', closeTemplateEditModal);

templateEditSaveBtn.addEventListener('click', async () => {
  const name = templateEditNameEl.value.trim();
  const text = templateEditTextEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'テンプレート名と本文を入力してください';
    return;
  }
  await window.api.updateTemplate({ id: editingTemplateId, name, text });
  closeTemplateEditModal();
  renderTemplates();
});

saveTemplateBtn.addEventListener('click', async () => {
  const name = templateNameEl.value.trim();
  const text = templateTextEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'テンプレート名と本文を入力してください';
    return;
  }
  await window.api.saveTemplate({ name, text });
  templateNameEl.value = '';
  templateTextEl.value = '';
  renderTemplates();
});

function openTemplateApplyModal(template, onApply) {
  applyingTemplate = { template, onApply };
  const variables = extractTemplateVariables(template.text);
  templateApplyFieldsEl.innerHTML = '';
  if (!variables.length) {
    const note = document.createElement('div');
    note.className = 'no-vars';
    note.textContent = 'このテンプレートに変数はありません。そのまま反映します。';
    templateApplyFieldsEl.appendChild(note);
  } else {
    variables.forEach((varName) => {
      const field = document.createElement('div');
      field.className = 'template-var-field';
      const label = document.createElement('label');
      label.textContent = varName;
      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.varName = varName;
      field.appendChild(label);
      field.appendChild(input);
      templateApplyFieldsEl.appendChild(field);
    });
  }
  templateApplyOverlayEl.classList.add('open');
}

function closeTemplateApplyModal() {
  applyingTemplate = null;
  templateApplyOverlayEl.classList.remove('open');
}

templateApplyCancelBtn.addEventListener('click', closeTemplateApplyModal);

templateApplyConfirmBtn.addEventListener('click', () => {
  if (!applyingTemplate) return;
  const { template, onApply } = applyingTemplate;
  const inputs = templateApplyFieldsEl.querySelectorAll('input[data-var-name]');
  const values = {};
  inputs.forEach((input) => {
    values[input.dataset.varName] = input.value;
  });
  const result = substituteTemplateVariables(template.text, values);
  closeTemplateApplyModal();
  onApply(result);
});
