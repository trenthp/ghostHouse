/**
 * Centralized modal management system
 * Handles showing/hiding modals with stack-based control to prevent overlaps
 */
export class ModalManager {
    constructor() {
        this.modalStack = []; // Stack of currently open modal IDs
        this.modals = {}; // Reference to modal elements by ID
    }

    /**
     * Register a modal element so the manager can control it
     * @param {string} modalId - The ID of the modal element
     * @param {HTMLElement} modalElement - The modal element
     */
    registerModal(modalId, modalElement) {
        this.modals[modalId] = modalElement;
    }

    /**
     * Show a modal
     * @param {string} modalId - The ID of the modal to show
     * @returns {boolean} - True if modal was shown, false if already open
     */
    show(modalId) {
        if (!this.modals[modalId]) {
            console.warn(`Modal "${modalId}" not registered`);
            return false;
        }

        // If this modal is already open, don't show it again
        if (this.modalStack.includes(modalId)) {
            return false;
        }

        // Hide all other modals
        this.hideAll();

        // Show this modal
        const modal = this.modals[modalId];
        modal.classList.add('active');
        this.modalStack.push(modalId);

        return true;
    }

    /**
     * Hide a specific modal
     * @param {string} modalId - The ID of the modal to hide
     * @returns {boolean} - True if modal was hidden, false if not open
     */
    hide(modalId) {
        if (!this.modals[modalId]) {
            console.warn(`Modal "${modalId}" not registered`);
            return false;
        }

        const modal = this.modals[modalId];
        modal.classList.remove('active');

        // Remove from stack
        const index = this.modalStack.indexOf(modalId);
        if (index > -1) {
            this.modalStack.splice(index, 1);
        }

        return true;
    }

    /**
     * Hide all open modals
     */
    hideAll() {
        this.modalStack.forEach(modalId => {
            const modal = this.modals[modalId];
            if (modal) {
                modal.classList.remove('active');
            }
        });
        this.modalStack = [];
    }

    /**
     * Check if a modal is currently open
     * @param {string} modalId - The ID of the modal to check
     * @returns {boolean} - True if modal is open
     */
    isOpen(modalId) {
        return this.modalStack.includes(modalId);
    }

    /**
     * Get the ID of the currently open modal (top of stack)
     * @returns {string|null} - The ID of the open modal, or null if none are open
     */
    getTopModal() {
        return this.modalStack.length > 0 ? this.modalStack[this.modalStack.length - 1] : null;
    }

    /**
     * Get all currently open modals
     * @returns {string[]} - Array of modal IDs that are open
     */
    getOpenModals() {
        return [...this.modalStack];
    }
}
