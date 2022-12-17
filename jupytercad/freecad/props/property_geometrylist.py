from typing import Any, List
from .geometry import geom_handlers
from .base_prop import BaseProp


class Part_PropertyGeometryList(BaseProp):
    @staticmethod
    def name() -> str:
        return 'Part::PropertyGeometryList'

    @staticmethod
    def fc_to_jcad(prop_value: List, jcad_file=None, fc_file=None) -> Any:
        ret = []
        for geo in prop_value:
            if geo.TypeId in geom_handlers:
                ret.append(geom_handlers[geo.TypeId].fc_to_jcad(geo))
        return [ret]

    @staticmethod
    def jcad_to_fc(prop_value: List, jcad_file=None, fc_file=None, fc_object=None) -> Any:
        print('###', prop_value, fc_object)
        return None
