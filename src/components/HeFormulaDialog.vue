<template>
	<Teleport to="body">
		<div v-if="modelValue" class="he-modal" @click.self="close">
			<div class="he-modal__panel">
				<div class="he-modal__header">
					<h3 class="he-modal__title">{{ dialogTitle }}</h3>
					<button class="he-modal__close" type="button" :aria-label="t('common.close')" @click="close">×</button>
				</div>

				<div class="he-modal__body">
					<HeFormulaEditor ref="editorRef" v-model="latex" v-model:display="displayMode" />
				</div>

				<div class="he-modal__footer">
					<button class="he-btn" type="button" @click="close">{{ cancelLabel }}</button>
					<button class="he-btn he-btn--primary" type="button" @click="confirm">{{ confirmLabel }}</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import HeFormulaEditor from './HeFormulaEditor.vue'

/**
 * HeFormulaDialog —— 公式编辑弹窗容器
 * 只负责遮罩、标题、底部按钮与开关状态；实际编辑内容由 HeFormulaEditor 提供。
 * 打开时通过 latex / display 传入初始值，确认后回传文本与是否行间。
 */
const props = withDefaults(
	defineProps<{
		modelValue: boolean
		latex?: string
		/** 初始是否为行间公式（$$...$$） */
		display?: boolean
		title?: string
		confirmText?: string
		cancelText?: string
	}>(),
	{
		latex: '',
		display: true,
		title: '',
		confirmText: '',
		cancelText: ''
	}
)

const emit = defineEmits<{
	(e: 'update:modelValue', value: boolean): void
	(e: 'confirm', latex: string, display: boolean): void
}>()

const { t } = useI18n()

const dialogTitle = computed(() => props.title || t('formula.dialogTitle'))
const confirmLabel = computed(() => props.confirmText || t('common.confirm'))
const cancelLabel = computed(() => props.cancelText || t('common.cancel'))

const latex = ref('')
const displayMode = ref(false)
const editorRef = ref<InstanceType<typeof HeFormulaEditor>>()

watch(
	() => props.modelValue,
	(visible) => {
		if (!visible) return
		latex.value = props.latex ?? ''
		displayMode.value = props.display
		nextTick(() => editorRef.value?.focus())
	}
)

const close = () => {
	emit('update:modelValue', false)
}

const confirm = () => {
	if (!editorRef.value?.validate()) return
	emit('confirm', latex.value.trim(), displayMode.value)
	emit('update:modelValue', false)
}
</script>

<style scoped>
.he-modal {
	position: fixed;
	inset: 0;
	z-index: 2000;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(0, 0, 0, 0.45);
	backdrop-filter: blur(3px);
}

.he-modal__panel {
	width: 720px;
	max-width: 94vw;
	max-height: 90vh;
	display: flex;
	flex-direction: column;
	background: #fff;
	border-radius: 12px;
	box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	overflow: hidden;
}

.he-modal__header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 16px 20px;
	border-bottom: 1px solid #eef0f3;
}

.he-modal__title {
	font-size: 16px;
	font-weight: 600;
}

.he-modal__close {
	width: 30px;
	height: 30px;
	border: none;
	border-radius: 50%;
	background: #f5f6f8;
	color: #666;
	font-size: 18px;
	line-height: 1;
	cursor: pointer;
	transition: background 0.15s;
}

.he-modal__close:hover {
	background: #e8eaed;
}

.he-modal__body {
	padding: 18px 20px;
	overflow-y: auto;
}

.he-modal__footer {
	display: flex;
	justify-content: flex-end;
	gap: 10px;
	padding: 14px 20px;
	border-top: 1px solid #eef0f3;
}

.he-btn {
	padding: 8px 18px;
	border: 1px solid #d9dde3;
	border-radius: 6px;
	background: #fff;
	font-size: 13px;
	color: #444;
	cursor: pointer;
	transition: all 0.15s;
}

.he-btn:hover {
	background: #f5f7fa;
}

.he-btn--primary {
	background: #3b6ef5;
	border-color: #3b6ef5;
	color: #fff;
}

.he-btn--primary:hover {
	background: #2f5ee0;
}
</style>
