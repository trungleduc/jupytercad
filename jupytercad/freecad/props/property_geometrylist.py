from typing import Any, List
from .geometry import geom_handlers
from .base_prop import BaseProp


class Part_PropertyGeometryList(BaseProp):
    @staticmethod
    def name() -> str:
        return 'Part::PropertyGeometryList'

    @staticmethod
    def fc_to_jcad(prop_value: List, **kwargs) -> Any:
        ret = []
        for geo in prop_value:
            if geo.TypeId in geom_handlers:
                ret.append(geom_handlers[geo.TypeId].fc_to_jcad(geo))
        return ret

    @staticmethod
    def jcad_to_fc(prop_value: List, fc_prop: List=None, **kwargs) -> Any:
        for idx, jcad_geo in enumerate(prop_value) :
            if jcad_geo['TypeId'] in geom_handlers:
                geom_handlers[jcad_geo['TypeId']].jcad_to_fc(jcad_geo, fc_object=fc_prop[idx])
        return None
