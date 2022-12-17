from typing import Any, Dict

from ..base_prop import BaseProp

try:
    import freecad as fc
except ImportError:
    fc = None


class Part_GeomCircle(BaseProp):
    @staticmethod
    def name() -> str:
        return 'Part::GeomCircle'

    @staticmethod
    def fc_to_jcad(prop_value: Any, jcad_file=None, fc_file=None) -> Any:
        center = prop_value.Center
        radius = prop_value.Radius
        angle = prop_value.AngleXU
        normal = prop_value.Axis
        return {
            'CenterX': center.x,
            'CenterY': center.y,
            'CenterZ': center.z,
            'NormalX': normal.x,
            'NormalY': normal.y,
            'NormalZ': normal.z,
            'AngleXU': angle,
            'Radius': radius,
        }

    @staticmethod
    def jcad_to_fc(prop_value: Dict, jcad_file=None, fc_file=None) -> Any:
        if not fc:
            return

        Center = fc.app.Base.Vector(
            prop_value['CenterX'], prop_value['CenterY'], prop_value['CenterZ']
        )
        Axis = fc.app.Base.Vector(
            prop_value['NormalX'], prop_value['NormalY'], prop_value['NormalZ']
        )
        AngleXU = prop_value['AngleXU']
        Radius = prop_value['Radius']
        return None
