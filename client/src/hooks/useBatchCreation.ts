import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import axios from "axios";

interface TemplateSummary {
    id: string;
    title: string;
    description?: string;
}

interface ProductSummary {
    id: string;
    productName: string;
    productCode: string;
}

interface CreationForm {
    productId: string;
    plannedQuantity: string;
    actualQuantity: string;
    unit: string;
    status: string;
    shelfLifeMonths: string;
    manufacturingDate: string;
    expiryDate: string;
}

export function useBatchCreation() {
    const navigate = useNavigate();
    const { user, getAccessTokenSilently } = useAuth0();
    const serverPath = import.meta.env.VITE_API_SERVER_URL as string;

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [selectedTemplate, setSelectedTemplate] =
        useState<TemplateSummary | null>(null);
    const [products, setProducts] = useState<ProductSummary[]>([]);
    const [creationForm, setCreationForm] = useState<CreationForm>({
        productId: "",
        plannedQuantity: "",
        actualQuantity: "",
        unit: "",
        status: "IN_PROGRESS",
        shelfLifeMonths: "",
        manufacturingDate: "",
        expiryDate: "",
    });
    const [createError, setCreateError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const userId = user?.sub;

    const getAuthToken = async () => {
        const token = await getAccessTokenSilently({
            authorizationParams: {
                scope: "openid email profile",
                audience: import.meta.env.VITE_AUTH0_AUDIENCE,
            },
        });
        return token;
    };

    // Reset error when modal opens/closes
    useEffect(() => {
        if (!isTemplateModalOpen) {
            setCreateError(null);
        }
    }, [isTemplateModalOpen]);

    // Load products when template is selected
    useEffect(() => {
        if (!selectedTemplate) return;

        const loadProducts = async () => {
            try {
                const response = await axios.get(`${serverPath}/api/products`, {
                    headers: {
                        Authorization: `Bearer ${await getAuthToken()}`,
                    },
                });
                const productData = Array.isArray(response.data) ? response.data : [];
                setProducts(
                    productData.map((product: any) => ({
                        id: product.id,
                        productName: product.productName ?? "Unknown Product",
                        productCode: product.productCode ?? "N/A",
                    }))
                );
            } catch (err) {
                console.error("Error fetching products:", err);
                setCreateError("Unable to load products. Please try again.");
            }
        };

        void loadProducts();
    }, [selectedTemplate, serverPath]);

    const handleAddNewBatch = () => {
        setIsTemplateModalOpen(true);
    };

    const closeTemplateModal = () => {
        setIsTemplateModalOpen(false);
    };

    const handleTemplateSelect = (template: TemplateSummary) => {
        setSelectedTemplate(template);
        setIsTemplateModalOpen(false);
    };

    const resetCreationFlow = () => {
        setSelectedTemplate(null);
        setCreationForm({
            productId: "",
            plannedQuantity: "",
            actualQuantity: "",
            unit: "",
            status: "IN_PROGRESS",
            shelfLifeMonths: "",
            manufacturingDate: "",
            expiryDate: "",
        });
        setCreateError(null);
    };

    const handleCreationInputChange = (field: string, value: string) => {
        setCreationForm((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleCreateBatchRecord = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedTemplate) return;

        if (!creationForm.productId) {
            setCreateError("Product is required.");
            return;
        }

        if (
            !creationForm.plannedQuantity ||
            Number(creationForm.plannedQuantity) <= 0
        ) {
            setCreateError("Planned quantity must be greater than zero.");
            return;
        }

        if (!creationForm.unit || !creationForm.unit.trim()) {
            setCreateError("Unit is required.");
            return;
        }

        if (
            !creationForm.shelfLifeMonths ||
            Number(creationForm.shelfLifeMonths) < 0
        ) {
            setCreateError("Shelf life (months) must be zero or greater.");
            return;
        }

        if (!creationForm.manufacturingDate || !creationForm.expiryDate) {
            setCreateError("Manufacturing and expiry dates are required.");
            return;
        }

        if (!user?.sub) {
            setCreateError(
                "Unable to determine the current user. Please sign in again."
            );
            return;
        }

        try {
            setCreating(true);
            setCreateError(null);
            const token = await getAuthToken();
            // Fetch the full template to get the active version ID
            const templateResponse = await axios.get(
                `${serverPath}/api/templates/${selectedTemplate.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );
            const fullTemplate = templateResponse.data;

            if (!fullTemplate?.activeVersion?.id) {
                throw new Error(
                    "Template does not have an active version. Please select a different template."
                );
            }

            const payload = {
                productId: creationForm.productId,
                templateId: selectedTemplate.id,
                templateVersionId: fullTemplate.activeVersion.id,
                plannedQuantity: Number(creationForm.plannedQuantity),
                actualQuantity: creationForm.actualQuantity
                    ? Number(creationForm.actualQuantity)
                    : null,
                unit: (creationForm.unit || "").trim(),
                status: creationForm.status as any,
                shelfLifeMonths: Number(creationForm.shelfLifeMonths),
                manufacturingDate: new Date(
                    creationForm.manufacturingDate
                ).toISOString(),
                expiryDate: new Date(creationForm.expiryDate).toISOString(),
                createdBy: userId,
            };

            const response = await axios.post(
                `${serverPath}/api/batchRecords`,
                payload,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const newRecordId = response.data?.id;

            if (!newRecordId) {
                throw new Error("Server did not return the new batch record ID.");
            }

            navigate(`/BatchRecordsEditor?id=${newRecordId}`);
        } catch (err: any) {
            console.error("Error creating batch record:", err);
            const message =
                err.response?.data?.error ||
                err.message ||
                "Failed to create batch record.";
            setCreateError(message);
        } finally {
            setCreating(false);
        }
    };

    return {
        // State
        isTemplateModalOpen,
        selectedTemplate,
        products,
        creationForm,
        createError,
        creating,
        // Handlers
        handleAddNewBatch,
        closeTemplateModal,
        handleTemplateSelect,
        resetCreationFlow,
        handleCreationInputChange,
        handleCreateBatchRecord,
    };
}

