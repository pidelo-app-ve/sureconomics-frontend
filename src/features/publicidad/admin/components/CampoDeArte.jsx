import PropTypes from "prop-types";
import { AssetField } from "../../../../components/admin/AssetField";
import { ACCEPTED_IMAGE_MIME } from "../../../../services/adminMediaService";
import { subidaDeArte } from "../api";
import { AligerarArte } from "./AligerarArte";

/**
 * El selector del arte de un anuncio (o del logotipo de un anunciante), y «Aligerar»
 * debajo si el que está puesto pesa de más. Lo que se sube se aligera solo al tamaño de
 * su hueco (`medidas`, de `MEDIDAS_DE_ARTE`).
 *
 * `onReemplazar` guarda el arte aligerado en lugar del de ahora y resuelve a `true` si
 * salió (ver `guardarSoloEseArte`).
 */
export const CampoDeArte = ({
  id,
  etiqueta,
  pista,
  forma,
  medidas,
  valor,
  asset,
  onChange,
  preguntar,
  ocupado,
  onReemplazar,
}) => (
  <>
    <AssetField
      id={id}
      label={etiqueta}
      hint={pista}
      forma={forma}
      kind="image"
      value={valor ?? null}
      asset={asset}
      onChange={onChange}
      onUpload={subidaDeArte(medidas)}
      accept={ACCEPTED_IMAGE_MIME}
    />
    {valor ? (
      <AligerarArte
        asset={asset}
        medidas={medidas}
        preguntar={preguntar}
        deshabilitado={ocupado}
        onReemplazar={onReemplazar}
      />
    ) : null}
  </>
);

CampoDeArte.propTypes = {
  id: PropTypes.string.isRequired,
  etiqueta: PropTypes.string.isRequired,
  pista: PropTypes.string,
  forma: PropTypes.shape({ ancho: PropTypes.number.isRequired, alto: PropTypes.number.isRequired }),
  /** La caja de su hueco (`MEDIDAS_DE_ARTE`). */
  medidas: PropTypes.shape({ ancho: PropTypes.number.isRequired, alto: PropTypes.number.isRequired }).isRequired,
  /** El id del archivo puesto, o nada. */
  valor: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  asset: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  preguntar: PropTypes.func.isRequired,
  ocupado: PropTypes.bool,
  onReemplazar: PropTypes.func.isRequired,
};
