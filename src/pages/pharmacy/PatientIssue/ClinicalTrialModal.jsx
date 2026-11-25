import React, { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import Tables from '../../../components/UI/customTable'
import { DesignContext } from '@app/providers/DesignProvider'
import { SmartTable, RecordCard } from '@app/components/modern'
import { FlaskConical } from 'lucide-react'

export default function ClinicalTrialModal({ bodyData }) {
    const [t] = useTranslation()
    const { isModern } = useContext(DesignContext)
    const thead = [
        { name: t("S.No."), width: "1%" },
        { name: t("Date"), width: "1%" },
        { name: t("Remarks"), width: "1%" }
    ]

    if (isModern) {
        return (
            <SmartTable
                data={bodyData || []}
                columns={[
                    { key: "sno", label: t("S.No."), w: 60, align: "center", render: (_r, i) => i + 1 },
                    { key: "Date", label: t("Date"), w: 140, render: (r) => r?.EntryDateTime },
                    { key: "Remarks", label: t("Remarks"), grow: true, wrap: true, render: (r) => r?.Remarks },
                ]}
                getRowKey={(_r, i) => i}
                searchKeys={["EntryDateTime", "Remarks"]}
                emptyText={t("No records")}
                searchPlaceholder={t("Search") + "..."}
                storageKey="clinicalTrialView"
                maxHeight="45vh"
                enableCardView
                cardMinWidth={260}
                renderCard={(val, i) => (
                  <RecordCard
                    accentSeed={val?.EntryDateTime || i}
                    header={{ index: i + 1 }}
                    title={{ icon: FlaskConical, text: val?.EntryDateTime }}
                    footnote={{ text: val?.Remarks }}
                  />
                )}
                i18n={{ records: t("records"), showing: t("Showing"), scrollMore: t("scroll for more"), table: t("Table"), card: t("Card") }}
            />
        )
    }

    return (
        <>
            <Tables
                thead={thead}
                tbody={bodyData?.length > 0 && bodyData?.map((val, index) => ({
                    sno: index + 1,
                    Date: val?.EntryDateTime,
                    Remarks: val?.Remarks,
                }))}

            />
        </>
    )
}
