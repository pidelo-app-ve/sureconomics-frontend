import { useCallback, useEffect, useState } from "react";
import {
    groupPlaces,
    listAdminFormats,
    listAdminPlaces,
    listAdminTopics,
} from "../../../services/adminTaxonomyService";

/** Los formatos, los temas y los lugares que se pueden elegir, pedidos una vez al abrir. */
export const useTaxonomiaDelEditor = () => {
    const [formats, setFormats] = useState([]);
    const [topics, setTopics] = useState([]);
    const [placeGroups, setPlaceGroups] = useState([]);

    const loadReference = useCallback(async () => {
        const [fmts, tps, pls] = await Promise.all([
            listAdminFormats().catch(() => []),
            listAdminTopics().catch(() => []),
            listAdminPlaces().catch(() => []),
        ]);
        setFormats(fmts.filter((f) => f.is_active !== false));
        setTopics(tps.filter((t) => t.is_active !== false));
        const { groups } = groupPlaces(pls.filter((p) => p.is_active !== false));
        setPlaceGroups(groups);
    }, []);

    useEffect(() => {
        loadReference();
    }, [loadReference]);

    return { formats, topics, placeGroups };
};
