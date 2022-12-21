from typing import Any, Dict

from ..base_prop import BaseProp

try:
    import freecad as fc
except ImportError:
    fc = None


class Part_GeomLineSegment(BaseProp):
    @staticmethod
    def name() -> str:
        return 'Part::GeomLineSegment'

    @staticmethod
    def fc_to_jcad(prop_value: Any, **kwargs) -> Any:
        start = prop_value.StartPoint
        end = prop_value.EndPoint

        return {
            'TypeId': Part_GeomLineSegment.name(),
            'StartX': start.x,
            'StartY': start.y,
            'StartZ': start.z,
            'EndX': end.x,
            'EndY': end.y,
            'EndZ': end.z,
        }

    @staticmethod
    def jcad_to_fc(prop_value: Dict, fc_object: Any, **kwargs) -> Any:
        if not fc:
            return

        StartPoint = fc.app.Base.Vector(
            prop_value['StartX'], prop_value['StartY'], prop_value['StartZ']
        )
        fc_object.StartPoint = StartPoint

        EndPoint = fc.app.Base.Vector(
            prop_value['EndX'], prop_value['EndY'], prop_value['EndZ']
        )
        fc_object.EndPoint = EndPoint

        return None
